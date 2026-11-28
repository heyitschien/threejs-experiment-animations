import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { browserQA } from './browser.mjs';
import { verify } from './verify.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const demand = (value, message) => { if (!value) throw new Error(message); };
const digest = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: repo, encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, ...options });
  demand(result.status === 0, `${basename(command)} failed (${result.error ?? result.status})\n${result.stdout ?? ''}${result.stderr ?? ''}`);
  return result.stdout?.trim();
}

async function doctor() {
  demand(process.env.LAB_NPM && process.env.CADQUERY_PYTHON && process.env.BLENDER_BIN,
    'Export LAB_NPM, CADQUERY_PYTHON and BLENDER_BIN from the approved environment');
  return JSON.parse(run(process.execPath, [join(here, '../session-0.1/lab.mjs'), 'doctor']));
}

async function generate(out) {
  await doctor();
  await mkdir(out);
  run(process.env.CADQUERY_PYTHON, ['-B', join(here, 'cad.py'), out]);
  run(process.env.BLENDER_BIN, ['--background', '--factory-startup', '--disable-autoexec', '--python-exit-code', '23',
    '--python', join(here, 'blender.py'), '--', out]);
  return verify(out);
}

async function packagePreview(out, geometry) {
  const assets = join(here, 'public/assets');
  await mkdir(assets, { recursive: true });
  const spec = geometry.spec;
  const files = ['spec.json', 'cad.json', 'blender.json', 'shade.glb', 'hero.png',
    ...spec.parts.flatMap((part) => [`${part.file}.step`]),
    ...spec.poses.map((pose) => `${pose.id}.step`)];
  for (const file of files) await cp(join(out, file), join(assets, file), { force: true });
  await writeFile(join(assets, 'geometry.json'), JSON.stringify(geometry, null, 2) + '\n');
  const manifestFiles = [...files, 'geometry.json', 'reference.svg'].sort();
  const hashes = Object.fromEntries(await Promise.all(manifestFiles.map(async (file) =>
    [file, await digest(join(assets, file))])));
  const manifest = { schema: 1, id: spec.id, passed: true,
    provenance: { cad: 'CadQuery 2.8.0 / OCP 7.9.3.1', glb_and_hero: 'Blender 4.4.0',
      viewer: 'Three.js 0.187.0 / Vite 7.1.x', washer: spec.joint.washer.source },
    coordinate_mapping: spec.coordinate_mapping, files: hashes };
  await writeFile(join(assets, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

async function pipeline(out) {
  const geometry = await generate(out);
  const manifest = await packagePreview(out, geometry);
  run(process.env.LAB_NPM, ['run', 'lw-shade:build']);
  const browser = await browserQA(join(here, 'dist'), join(out, 'browser'));
  await writeFile(join(out, 'browser.json'), JSON.stringify(browser, null, 2) + '\n');
  return { passed: true, geometry: { sample_count: geometry.sample_count, pairwise_checks: geometry.pairwise_checks },
    manifest, browser };
}

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' } } });
  demand(positionals.length === 1, 'Use doctor, run, verify, or package with --out PATH');
  if (positionals[0] === 'doctor') return console.log(JSON.stringify(await doctor(), null, 2));
  demand(values.out, 'Provide --out PATH');
  const out = resolve(values.out);
  if (positionals[0] === 'run') return console.log(JSON.stringify(await pipeline(out), null, 2));
  const geometry = await verify(out);
  if (positionals[0] === 'verify') return console.log(JSON.stringify({ passed: true, id: geometry.id,
    samples: geometry.sample_count, pairwise_checks: geometry.pairwise_checks }, null, 2));
  demand(positionals[0] === 'package', `Unknown command ${positionals[0]}`);
  console.log(JSON.stringify(await packagePreview(out, geometry), null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
