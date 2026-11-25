import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cp, mkdir, readdir, realpath, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { demand } from '../session-0.1/geometry.mjs';
import { digest, json, pins } from '../session-0.1/verify.mjs';
import { geometryNegatives, verifyGeometry } from './verify.mjs';
import { browserQA, screenshots, serve } from './browser.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const base = '742545fe46eb5b7bad040ae5b8a0f6cff1e45021';
const reviewBase = 'fd01eebfaf8414468f953d56f33ac9abdcfa5e77';
const freeze = '7a732fe6b85966b029dc85f7070b78d3fcce4d00';
const fixtureDigest = 'edf75a20d444e57a10f940ffd5d8371ee0c1f7458053e51f6d210397349d1fa2';
const stageFlags = ['--background', '--factory-startup', '--disable-autoexec', '--python-exit-code', '23'];
const env = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' };
delete env.PYTHONPATH;
delete env.PYTHONHOME;

function processResult(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: repo, env, encoding: 'utf8', timeout: 180_000 });
  return { status: result.status, output: (result.stdout ?? '') + (result.stderr ?? ''),
    stdout: result.stdout, error: result.error };
}

function checked(cmd, args) {
  const result = processResult(cmd, args);
  demand(result.status === 0, `${basename(cmd)} failed (${result.error ?? result.status})\n${result.output}`);
  return result.stdout.trim();
}

async function stage(out, name, cmd, args) {
  const result = processResult(cmd, args);
  await writeFile(join(out, name + '.log'), result.output, { flag: 'wx' });
  if (result.status !== 0) {
    throw Object.assign(new Error(`${name} failed (${result.error ?? result.status}). See ${name}.log`),
      { stageCode: result.status });
  }
}

const save = (out, file, data) => writeFile(join(out, file), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
const git = (...args) => checked('git', args);
const hashes = (dir, inputs) => Promise.all(inputs.sort().map(async (file) => [file, await digest(dir, file)]))
  .then(Object.fromEntries);

async function fixture() {
  demand(await digest(here, 'fixture.json') === fixtureDigest, 'Frozen HNG-001 fixture hash mismatch');
  return json(here, 'fixture.json');
}

async function sourceIdentity() {
  const files = (await readdir(here)).filter((name) => /\.(py|mjs|html|css|json)$/.test(name));
  return hashes(repo, [
    ...files.map((file) => relative(repo, join(here, file))),
    ...['geometry.mjs', 'verify.mjs', 'lab.mjs', 'requirements-macos-arm64.lock'].map(
      (file) => 'experiments/invention-lab/session-0.1/' + file),
    'experiments/invention-lab/session-0/model.py',
    'experiments/invention-lab/session-0/blender_export.py',
    'package-lock.json', 'package.json',
  ]);
}

function artifactNames(spec) {
  return ['run.json', 'fixture.json', 'cad.json', 'blender.json', 'geometry.json', 'browser.json', 'negative.json',
    ...screenshots,
    ...[...Object.values(spec.parts).map((p) => p.id), 'moving_edited'].flatMap((id) => [id + '.step', id + '.stl']),
    ...spec.poses.flatMap(({ id }) => [id + '.step', id + '.glb'])];
}

async function makeOutput(out) {
  const parent = await realpath(dirname(out));
  const dir = join(parent, basename(out));
  const local = relative(repo, dir);
  demand(local.startsWith('../') || isAbsolute(local) || local.startsWith('invention-lab-runs/'),
    'Choose a new output path under invention-lab-runs/ or outside the worktree');
  await mkdir(dir);
  return dir;
}

async function blenderFailure(out, blender) {
  const failed = join(out, 'failed-blender');
  await mkdir(failed);
  let exitCode = 0;
  try {
    await stage(failed, 'blender', blender, [...stageFlags, '--python-expr', 'raise RuntimeError("HNG-001 induced failure")']);
  } catch (error) {
    exitCode = error.stageCode;
  }
  demand(exitCode === 23 && JSON.stringify(await readdir(failed)) === '["blender.log"]',
    'Blender failure did not propagate or emitted unexpected artifacts');
  try { await verify(failed); } catch (error) {
    demand(error.code === 'ENOENT' && error.path.endsWith('manifest.json'), error.message);
    return { name: 'Blender raises before completion', passed: true, exit_code: exitCode, manifest_absent: true };
  }
  throw new Error('An incomplete failed run was accepted');
}

async function run(target) {
  const spec = await fixture();
  const doctor = join(here, '../session-0.1/lab.mjs');
  const versions = JSON.parse(checked(process.execPath, [doctor, 'doctor']));
  const python = env.CADQUERY_PYTHON ?? join(repo, '.venv-invention-lab/bin/python');
  const blender = env.BLENDER_BIN ?? 'blender';
  demand(env.BLENDER_BIN, 'Set BLENDER_BIN explicitly to the verified Session 0.1 copy');
  git('merge-base', '--is-ancestor', freeze, 'HEAD');
  const out = await makeOutput(target);
  const runId = randomUUID();
  const runInfo = { schema: 1, run_id: runId, base, review_base: reviewBase, freeze, head: git('rev-parse', 'HEAD'),
    clean: git('status', '--porcelain') === '', started_utc: new Date().toISOString(), versions,
    fixture_sha256: fixtureDigest, sources: await sourceIdentity() };
  await save(out, 'run.json', runInfo);
  await cp(join(here, 'fixture.json'), join(out, 'fixture.json'), { force: false, errorOnExist: true });
  await stage(out, 'cad', python, ['-B', join(here, 'cad.py'), out, runId]);
  await stage(out, 'blender', blender, [...stageFlags, '--python', join(here, 'blender.py'), '--', out, runId]);
  const geometry = await verifyGeometry(out, runInfo, spec);
  await save(out, 'geometry.json', geometry);
  const negatives = await geometryNegatives(out, spec);
  negatives.push(await blenderFailure(out, blender));
  await save(out, 'negative.json', { schema: 1, run_id: runId, passed: true, cases: negatives });
  await save(out, 'browser.json', await browserQA(out, geometry));
  demand(JSON.stringify(runInfo.sources) === JSON.stringify(await sourceIdentity()), 'Sources changed during run');
  const manifest = { schema: 1, run_id: runId, passed: true, files: await hashes(out, artifactNames(spec)) };
  await save(out, 'manifest.tmp', manifest);
  await rename(join(out, 'manifest.tmp'), join(out, 'manifest.json'));
  return manifest;
}

async function verify(out) {
  const manifest = await json(out, 'manifest.json');
  const meta = await json(out, 'run.json');
  const spec = await fixture();
  demand(manifest.schema === 1 && meta.schema === 1 && manifest.passed === true &&
    /^[a-f0-9-]{36}$/.test(meta.run_id) && manifest.run_id === meta.run_id &&
    meta.base === base && meta.review_base === reviewBase && meta.freeze === freeze && meta.fixture_sha256 === fixtureDigest &&
    await digest(out, 'fixture.json') === fixtureDigest && process.versions.node === pins.node &&
    (await json(repo, 'node_modules/three/package.json')).version === pins.three,
  'Invalid or stale run metadata');
  for (const key of ['uv', 'python', 'cadquery', 'ocp', 'blender', 'node', 'npm', 'three', 'playwright']) {
    demand(meta.versions?.[key] === pins[key], `Unexpected runtime receipt for ${key}`);
  }
  demand(JSON.stringify(meta.sources) === JSON.stringify(await sourceIdentity()), 'Source hash mismatch');
  demand(JSON.stringify(manifest.files) === JSON.stringify(await hashes(out, artifactNames(spec))),
    'Completion manifest mismatch');
  const geometry = await verifyGeometry(out, meta, spec);
  demand(JSON.stringify(geometry) === JSON.stringify(await json(out, 'geometry.json')), 'Geometry receipt mismatch');
  const browser = await json(out, 'browser.json');
  const negatives = await json(out, 'negative.json');
  demand(browser.schema === 1 && browser.run_id === meta.run_id && browser.passed === true &&
    browser.chromium === pins.chromium && browser.pose_labels?.length === 3 && browser.rejected?.length === 4 &&
    browser.recovery === true && browser.orbit === true && browser.autoplay === true && browser.page_errors?.length === 0,
  'Incomplete or invalid browser evidence');
  demand(negatives.schema === 1 && negatives.run_id === meta.run_id && negatives.passed === true &&
    negatives.cases?.length === 5 && negatives.cases.every((test) => test.passed === true),
  'Incomplete or invalid fail-closed evidence');
  return geometry;
}

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true,
    options: { out: { type: 'string' }, port: { type: 'string' } } });
  demand(positionals.length === 1 && values.out, 'Use run, verify, or viewer with --out PATH');
  const command = positionals[0], out = resolve(values.out);
  if (command === 'run') return console.log(JSON.stringify(await run(out), null, 2));
  const verified = await verify(out);
  if (command === 'verify') return console.log(JSON.stringify({ passed: true, run_id: verified.run_id,
    poses: Object.keys(verified.poses) }, null, 2));
  demand(command === 'viewer', `Unknown command ${command}`);
  const port = Number(values.port ?? '4177');
  demand(Number.isInteger(port) && port >= 1024 && port <= 65535, 'Invalid viewer port');
  const server = await serve(out, verified, port);
  console.log(server.url);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
