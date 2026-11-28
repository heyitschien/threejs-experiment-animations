import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, realpath, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { demand } from './geometry.mjs';
import { bytes, digest, hash, json, pins, verifyGeometry } from './verify.mjs';
import { browserQA, serve } from './browser.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const lock = join(here, 'requirements-macos-arm64.lock');
const venv = join(root, '.venv-invention-lab');
const base = 'e59fc23f6ca14f96225037bb828c43f247efc478';
const screenshots = ['browser-calibration.png', 'browser-variant.png', 'browser-missing.png'];
const safeEnvironment = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' };
delete safeEnvironment.PYTHONPATH;
delete safeEnvironment.PYTHONHOME;

function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: root, env: safeEnvironment,
    encoding: 'utf8', timeout: 180000, ...options });
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  return { code: result.status, error: result.error, output };
}

function checked(executable, args, options) {
  const result = command(executable, args, options);
  demand(result.code === 0, `${executable.split('/').at(-1)} failed (${result.error ?? result.code})\n${result.output}`);
  return result.output.trim();
}

async function executable(name, override, defaults) {
  const candidates = override ? [override] : defaults;
  for (const candidate of candidates) {
    const paths = candidate.includes('/') ? [resolve(candidate)] :
      (process.env.PATH ?? '').split(':').filter(Boolean).map((dir) => join(dir, candidate));
    for (const path of paths) {
      try { await access(path, constants.X_OK); } catch { continue; }
      return path;
    }
  }
  throw new Error(`${name} not found. Set the override in the runbook.`);
}

function version(actual, expected, label) {
  demand(actual === expected, `${label}: expected ${expected}, got ${actual}`);
  return actual;
}

async function tools() {
  demand(process.platform === 'darwin' && process.arch === 'arm64',
    'This wheel lock was validated on macOS arm64. See the runbook.');
  const npm = await executable('npm', process.env.LAB_NPM, ['npm']);
  version(process.versions.node, pins.node, 'Node');
  version(checked(npm, ['--version']), pins.npm, 'npm');
  return { npm };
}

async function bootstrap() {
  const { npm } = await tools();
  const python = await executable('Python 3.12', process.env.LAB_PYTHON, ['python3.12']);
  const uv = await executable('uv', process.env.LAB_UV, ['uv']);
  version(checked(python, ['-c', 'import platform; print(platform.python_version())']), pins.python, 'Python');
  version(checked(uv, ['--version']).split(/\s+/)[1], pins.uv, 'uv');
  await mkdir(venv); // An existing environment must be resumed explicitly or moved aside.
  checked(uv, ['venv', '--python', python, venv], { stdio: 'inherit' });
  checked(uv, ['--no-config', 'pip', 'sync', '--python', join(venv, 'bin/python'),
    '--default-index', 'https://pypi.org/simple', '--only-binary', ':all:', '--require-hashes', lock],
  { stdio: 'inherit' });
  checked(npm, ['ci'], { stdio: 'inherit' });
  checked(npm, ['run', 'qa:install'], { stdio: 'inherit' });
}

const packageVersion = async (name) => (await json(root, `node_modules/${name}/package.json`)).version;

async function doctor() {
  const { npm } = await tools();
  const uv = await executable('uv', process.env.LAB_UV, ['uv']);
  const python = await executable('CadQuery venv Python', process.env.CADQUERY_PYTHON, [join(venv, 'bin/python')]);
  const blender = await realpath(await executable('Blender', process.env.BLENDER_BIN,
    ['blender', '/Applications/Blender.app/Contents/MacOS/Blender']));
  const bundle = dirname(dirname(dirname(blender)));
  demand(bundle.endsWith('.app') && blender === join(bundle, 'Contents/MacOS/Blender'), 'Expected a signed Blender.app executable');
  checked('/usr/bin/codesign', ['--verify', '--deep', '--strict', bundle]);
  const identity = checked('/usr/bin/codesign', ['-dv', '--verbose=2', bundle]);
  demand(identity.includes('Identifier=org.blenderfoundation.blender') &&
    identity.includes('TeamIdentifier=68UA947AUU'), 'Unexpected Blender signing identity');
  const assessment = checked('/usr/sbin/spctl', ['--assess', '--type', 'execute', '--verbose=4', bundle]);
  demand(assessment.includes('source=Notarized Developer ID'), 'Blender notarization was not confirmed');
  const blenderVersion = checked(blender, ['--version']).match(/Blender (\d+\.\d+\.\d+)/)?.[1];
  version(blenderVersion, pins.blender, 'Blender');
  const probe = JSON.parse(checked(python, ['-c', [
    'import json, platform, sys, importlib.metadata as m, cadquery, OCP',
    'print(json.dumps(dict(python=platform.python_version(), arch=platform.machine(),',
    'isolated=sys.prefix != sys.base_prefix, cadquery=cadquery.__version__, ocp=OCP.__version__,',
    'packages={d.metadata["Name"].lower().replace("_","-"):d.version for d in m.distributions()})))',
  ].join('\n')]));
  demand(probe.isolated && probe.arch === 'arm64', 'Expected an isolated arm64 Python environment');
  const requirements = (await readFile(lock, 'utf8')).split('\n').filter((line) => line.includes('=='));
  for (const requirement of requirements) {
    const [name, expected] = requirement.split(' ')[0].split('==');
    version(probe.packages[name], expected, name);
  }
  demand(Object.keys(probe.packages).length === requirements.length, 'Unexpected Python distributions in the venv');
  const versions = { host: checked('/usr/bin/sw_vers', ['-productVersion']), arch: probe.arch,
    uv: version(checked(uv, ['--version']).split(/\s+/)[1], pins.uv, 'uv'),
    python: version(probe.python, pins.python, 'Python'), cadquery: version(probe.cadquery, pins.cadquery, 'CadQuery'),
    ocp: version(probe.ocp, pins.ocp, 'OCP'), blender: blenderVersion, blender_trust: 'Notarized Developer ID',
    node: process.versions.node, npm: checked(npm, ['--version']),
    three: version(await packageVersion('three'), pins.three, 'Three.js'), vite: await packageVersion('vite'),
    playwright: version(await packageVersion('playwright'), pins.playwright, 'Playwright') };
  return { python, blender, versions };
}

const write = (out, file, data) => writeFile(join(out, file), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
async function hashes(out, files) {
  return Object.fromEntries(await Promise.all(files.sort().map(async (file) => [file, await digest(out, file)])));
}
async function sourceIdentity() {
  const files = (await readdir(here)).filter((file) => /\.(py|mjs|html|json|lock)$/.test(file));
  return hashes(root, [
    ...files.map((file) => relative(root, join(here, file))),
    'package-lock.json', 'package.json', 'experiments/invention-lab/session-0/model.py',
    'experiments/invention-lab/session-0/blender_export.py', 'experiments/invention-lab/session-0/viewer/style.css',
  ]);
}
function artifactFiles(spec) {
  return ['spec.json', 'run.json', 'cad.json', 'blender.json', 'geometry.json', 'browser.json', ...screenshots,
    ...spec.models.flatMap(({ id }) => ['step', 'stl', 'glb'].map((ext) => `${id}.${ext}`))];
}

async function runStage(out, name, executable, args) {
  const result = command(executable, args);
  await writeFile(join(out, `${name}.log`), result.output, { flag: 'wx' });
  demand(result.code === 0, `${name} failed (exit ${result.error ?? result.code}). See ${name}.log.`);
}

async function ensureOutput(path) {
  const parent = await realpath(dirname(path));
  const dir = join(parent, path.split('/').at(-1));
  const local = relative(root, dir);
  demand(local.startsWith('../') || isAbsolute(local) || local.startsWith('invention-lab-runs/'),
    'Run output must be outside the worktree or inside invention-lab-runs/');
  await mkdir(dir);
  return dir;
}

async function run(dir, runtime, blenderScript = join(here, 'blender.py')) {
  const out = await ensureOutput(dir);
  const spec = await json(here, 'spec.json');
  const metadata = { schema: 1, run_id: randomUUID(), calibration_base: base,
    head: checked('git', ['rev-parse', 'HEAD']),
    worktree_clean: checked('git', ['status', '--porcelain', '--untracked-files=normal']) === '',
    started_utc: new Date().toISOString(), versions: runtime.versions, sources: await sourceIdentity() };
  await write(out, 'run.json', metadata);
  await cp(join(here, 'spec.json'), join(out, 'spec.json'), { force: false, errorOnExist: true });
  await runStage(out, 'cad', runtime.python, [join(here, 'cad.py'), out, metadata.run_id]);
  await runStage(out, 'blender', runtime.blender, ['--background', '--factory-startup', '--disable-autoexec',
    '--python-exit-code', '23', '--python', blenderScript, '--', out, metadata.run_id]);
  const geometry = await verifyGeometry(out, metadata, spec, runtime.versions.three);
  await write(out, 'geometry.json', geometry);
  await write(out, 'browser.json', await browserQA(out, geometry));
  demand(JSON.stringify(metadata.sources) === JSON.stringify(await sourceIdentity()),
    'Run sources changed during calibration');
  const manifest = { schema: 1, status: 'passed', run_id: metadata.run_id,
    files: await hashes(out, artifactFiles(spec)) };
  await write(out, 'manifest.tmp', manifest);
  await rename(join(out, 'manifest.tmp'), join(out, 'manifest.json'));
  return manifest;
}

async function verify(out) {
  version(process.versions.node, pins.node, 'Node');
  const manifest = await json(out, 'manifest.json');
  const metadata = await json(out, 'run.json');
  const spec = await json(here, 'spec.json');
  demand(manifest.schema === 1 && manifest.status === 'passed' && metadata.schema === 1 &&
    /^[0-9a-f-]{36}$/.test(metadata.run_id) && manifest.run_id === metadata.run_id &&
    metadata.calibration_base === base, 'Invalid or stale completion manifest');
  for (const key of ['uv', 'python', 'cadquery', 'ocp', 'blender', 'node', 'npm', 'three', 'playwright']) {
    version(metadata.versions?.[key], pins[key], `Recorded ${key}`);
  }
  demand(JSON.stringify(metadata.sources) === JSON.stringify(await sourceIdentity()) &&
    await digest(out, 'spec.json') === await digest(here, 'spec.json'), 'Run source/spec provenance mismatch');
  demand(JSON.stringify(manifest.files) === JSON.stringify(await hashes(out, artifactFiles(spec))),
    'Completion manifest file hash mismatch');
  const geometry = await verifyGeometry(out, metadata, spec, await packageVersion('three'));
  demand(JSON.stringify(geometry) === JSON.stringify(await json(out, 'geometry.json')), 'Stale GLB geometry receipt');
  const browser = await json(out, 'browser.json');
  demand(browser.schema === 1 && browser.run_id === metadata.run_id && browser.passed === true &&
    browser.chromium === pins.chromium && browser.orbit === true && browser.recovery === true,
  'Invalid or stale browser receipt');
  return geometry;
}

async function negative(out, original, runtime) {
  await verify(original);
  const dst = await ensureOutput(out);
  const outcomes = [];
  const spec = await json(here, 'spec.json');
  const meta = await json(original, 'run.json');
  const id = spec.models[0].id;
  async function rejects(name, operation, pattern) {
    try { await operation(); } catch (error) {
      demand(pattern.test(error.message), `${name}: wrong failure: ${error.message}`);
      outcomes.push({ name, rejected: true });
      return;
    }
    throw new Error(`${name}: unexpectedly accepted`);
  }
  async function fixture(name, omitted) {
    const dir = join(dst, name);
    await mkdir(dir);
    for (const file of [...artifactFiles(spec), 'manifest.json']) {
      if (file !== omitted) await cp(join(original, file), join(dir, file));
    }
    return dir;
  }
  const missing = await fixture('missing-glb', `${id}.glb`);
  await rejects('Missing GLB', () => verify(missing), /ENOENT.*\.glb/);
  const corrupt = await fixture('invalid-glb');
  const invalid = Buffer.from('invalid GLB bytes');
  await writeFile(join(corrupt, `${id}.glb`), invalid);
  const blend = await json(corrupt, 'blender.json');
  blend.models[0].glb_sha256 = hash(invalid);
  await writeFile(join(corrupt, 'blender.json'), JSON.stringify(blend));
  await rejects('Invalid GLB with matching stage hash',
    () => verifyGeometry(corrupt, meta, spec, pins.three), /JSON|GLTFLoader|unexpected/i);
  const stale = await fixture('stale-blender');
  const staleReport = await json(stale, 'blender.json');
  await writeFile(join(stale, 'blender.json'), JSON.stringify({ ...staleReport, run_id: randomUUID() }));
  await rejects('Stale Blender stage', () => verifyGeometry(stale, meta, spec, pins.three), /stale run ID/);
  const metrics = await fixture('invalid-metrics');
  const wrong = await json(metrics, 'blender.json');
  wrong.models[0].bounds_mm[0][0] = null;
  await writeFile(join(metrics, 'blender.json'), JSON.stringify(wrong));
  await rejects('Invalid numeric bounds', () => verifyGeometry(metrics, meta, spec, pins.three), /invalid vector/);
  await rejects('Hash mismatch', () => verify(metrics), /file hash mismatch/);
  await writeFile(join(metrics, 'blender.json'), JSON.stringify({ ...staleReport, passed: false }));
  await rejects('Failed upstream stage', () => verifyGeometry(metrics, meta, spec, pins.three), /failed stage/);
  await writeFile(join(metrics, 'blender.json'), JSON.stringify({ ...staleReport, models: [] }));
  await rejects('Empty upstream ID set', () => verifyGeometry(metrics, meta, spec, pins.three), /model-ID set/);
  const mirrored = await fixture('mirrored-landmark');
  const glb = Buffer.from(await bytes(mirrored, `${id}.glb`));
  const jsonLength = glb.readUInt32LE(12);
  const document = JSON.parse(glb.subarray(20, 20 + jsonLength));
  const accessor = document.accessors[document.meshes[0].primitives[0].attributes.POSITION];
  const bufferView = document.bufferViews[accessor.bufferView];
  for (let i = 0; i < accessor.count; i++) {
    const offset = 28 + jsonLength + bufferView.byteOffset + (accessor.byteOffset ?? 0) + i * 12 + 8;
    glb.writeFloatLE(-glb.readFloatLE(offset), offset);
  }
  await writeFile(join(mirrored, `${id}.glb`), glb);
  const mirroredReport = await json(mirrored, 'blender.json');
  mirroredReport.models[0].glb_sha256 = hash(glb);
  await writeFile(join(mirrored, 'blender.json'), JSON.stringify(mirroredReport));
  await rejects('Reflected GLB with unchanged bounds',
    () => verifyGeometry(mirrored, meta, spec, pins.three), /signed landmark/);
  const failed = join(dst, 'failed-blender');
  await rejects('Blender Python exit propagated', () => run(failed, runtime, join(here, 'cad.py')), /blender failed \(exit 23\)/);
  await rejects('Incomplete run rejected', () => verify(failed), /ENOENT.*manifest\.json/);
  await rejects('Existing run directory rejected', () => run(original, runtime), /EEXIST/);
  await write(dst, 'negative.json', { passed: true, outcomes });
  return outcomes;
}

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true,
    options: { out: { type: 'string' }, from: { type: 'string' }, port: { type: 'string' } } });
  demand(positionals.length === 1, 'Choose doctor, bootstrap, run, verify, viewer, or negative.');
  const action = positionals[0];
  if (action === 'bootstrap') return bootstrap();
  if (action === 'doctor') return console.log(JSON.stringify((await doctor()).versions, null, 2));
  demand(values.out, '--out is required');
  const out = resolve(values.out);
  if (action === 'run') return console.log(JSON.stringify(await run(out, await doctor()), null, 2));
  if (action === 'verify') return console.log(JSON.stringify(await verify(out), null, 2));
  if (action === 'negative') {
    demand(values.from, '--from must point to a verified run');
    return console.log(JSON.stringify(await negative(out, resolve(values.from), await doctor()), null, 2));
  }
  if (action === 'viewer') {
    const port = Number(values.port ?? '4175');
    demand(Number.isInteger(port) && port >= 1024 && port <= 65535, 'Invalid viewer port');
    const viewer = await serve(out, await verify(out), port);
    return console.log(viewer.url);
  }
  throw new Error(`Unknown command ${action}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
