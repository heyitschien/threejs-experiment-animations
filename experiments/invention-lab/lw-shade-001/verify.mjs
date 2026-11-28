import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const demand = (value, message) => { if (!value) throw new Error(message); };
const json = async (dir, file) => JSON.parse(await readFile(join(dir, file), 'utf8'));
export const digest = async (dir, file) => createHash('sha256').update(await readFile(join(dir, file))).digest('hex');
const slice = (buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

function close(actual, expected, tolerance, label) {
  demand(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} differs from ${expected}`);
}

function expectedBounds(part, cad) {
  const source = cad.parts[part.id].cad.bounds_mm;
  const dz = part.axis_z_mm ?? 0;
  const low = source[0], high = source[1];
  return [[low[0], low[2] + dz, -high[1]], [high[0], high[2] + dz, -low[1]]];
}

function triangles(mesh) {
  const { index, attributes: { position } } = mesh.geometry;
  return (index?.count ?? position.count) / 3;
}

export async function verify(out) {
  const [spec, cad, blender] = await Promise.all(['spec.json', 'cad.json', 'blender.json'].map((file) => json(out, file)));
  demand(spec.schema === 1 && spec.id === 'LW-SHADE-001', 'invalid specification');
  demand(cad.passed === true && cad.id === spec.id && cad.spec_sha256 === await digest(out, 'spec.json'), 'invalid CAD receipt');
  demand(blender.passed === true && blender.id === spec.id && blender.cad_sha256 === await digest(out, 'cad.json'), 'invalid Blender receipt');
  demand(cad.sample_count === 13 && cad.samples.length === 13 && cad.pairwise_checks_per_sample === 15,
    'incomplete CAD sampling');
  demand(cad.samples.every((sample, index) => sample.angle_deg === index * 5 && sample.intersections.length === 15 &&
    sample.intersections.every((entry) => entry.intersection_mm3 <= spec.oracles.non_intended_intersection_mm3) &&
    sample.analytic.loop_closure_error_mm <= spec.oracles.loop_closure_mm &&
    sample.analytic.angle_agreement_error_deg <= spec.oracles.angle_agreement_deg), 'CAD sample failed');
  demand(blender.glb_sha256 === await digest(out, 'shade.glb') && blender.hero_sha256 === await digest(out, 'hero.png'),
    'Blender asset hash mismatch');
  const bytes = await readFile(join(out, 'shade.glb'));
  const gltf = await new GLTFLoader().parseAsync(slice(bytes), '');
  gltf.scene.updateMatrixWorld(true);
  const nodes = new Map();
  gltf.scene.traverse((node) => {
    if (node.isMesh && node.userData.part_id) {
      demand(!nodes.has(node.userData.part_id), `duplicate GLB ID ${node.userData.part_id}`);
      nodes.set(node.userData.part_id, node);
    }
  });
  const expectedIds = spec.parts.map((part) => part.id).sort();
  demand(JSON.stringify([...nodes.keys()].sort()) === JSON.stringify(expectedIds), 'unexpected GLB component IDs');
  const parts = {};
  for (const part of spec.parts) {
    const mesh = nodes.get(part.id);
    const box = new Box3().setFromObject(mesh);
    const actual = [box.min, box.max].map((v) => v.toArray().map((n) => n * 1000));
    const expected = expectedBounds(part, cad);
    actual.flatMap((point) => point).forEach((value, index) =>
      close(value, expected.flatMap((point) => point)[index], spec.oracles.glb_position_mm, `${part.id} GLB bounds`));
    const count = triangles(mesh);
    demand(count === blender.parts[part.id].triangles, `${part.id}: GLB triangle count mismatch`);
    const position = new Vector3(); mesh.getWorldPosition(position);
    parts[part.id] = { bounds_mm: actual, triangles: count, world_position_m: position.toArray() };
  }
  return { schema: 1, id: spec.id, passed: true, units: 'm', axes: '[X,Z,-Y]',
    spec, glb_sha256: blender.glb_sha256, hero_sha256: blender.hero_sha256,
    cad_sha256: blender.cad_sha256, sample_count: 13, pairwise_checks: 195, parts };
}

export async function verifyNegatives(out) {
  const cases = [];
  async function expectRejected(name, mutate, pattern) {
    const dir = await mkdtemp(join(tmpdir(), 'lw-shade-neg-'));
    try {
      for (const file of ['spec.json', 'cad.json', 'blender.json', 'shade.glb', 'hero.png']) {
        await cp(join(out, file), join(dir, file));
      }
      await mutate(dir);
      let error = null;
      try { await verify(dir); } catch (err) { error = err; }
      demand(error && pattern.test(error.message), `Negative control "${name}" was not rejected (got: ${error?.message ?? 'PASSED'})`);
      cases.push({ name, passed: true, error: error.message });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  await expectRejected('incorrect loop closure in cad.json', async (dir) => {
    const cad = await json(dir, 'cad.json');
    cad.samples[5].analytic.loop_closure_error_mm = 1.0;
    await writeFile(join(dir, 'cad.json'), JSON.stringify(cad, null, 2) + '\n');
    const blender = await json(dir, 'blender.json');
    blender.cad_sha256 = await digest(dir, 'cad.json');
    await writeFile(join(dir, 'blender.json'), JSON.stringify(blender, null, 2) + '\n');
  }, /CAD sample failed/);

  await expectRejected('out-of-tolerance GLB bounds (>0.5 mm)', async (dir) => {
    const cad = await json(dir, 'cad.json');
    cad.parts['shade.coupler'].cad.bounds_mm[0][1] += 2.0;
    await writeFile(join(dir, 'cad.json'), JSON.stringify(cad, null, 2) + '\n');
    const blender = await json(dir, 'blender.json');
    blender.cad_sha256 = await digest(dir, 'cad.json');
    await writeFile(join(dir, 'blender.json'), JSON.stringify(blender, null, 2) + '\n');
  }, /GLB bounds/);

  await expectRejected('invalid component ID in spec.json', async (dir) => {
    const spec = await json(dir, 'spec.json');
    spec.parts[0].id = 'shade.unexpected_id';
    await writeFile(join(dir, 'spec.json'), JSON.stringify(spec, null, 2) + '\n');
    const cad = await json(dir, 'cad.json');
    cad.spec_sha256 = await digest(dir, 'spec.json');
    await writeFile(join(dir, 'cad.json'), JSON.stringify(cad, null, 2) + '\n');
    const blender = await json(dir, 'blender.json');
    blender.cad_sha256 = await digest(dir, 'cad.json');
    await writeFile(join(dir, 'blender.json'), JSON.stringify(blender, null, 2) + '\n');
  }, /unexpected GLB component IDs/);

  await expectRejected('tampered GLB hash in blender.json', async (dir) => {
    const blender = await json(dir, 'blender.json');
    blender.glb_sha256 = '0'.repeat(64);
    await writeFile(join(dir, 'blender.json'), JSON.stringify(blender, null, 2) + '\n');
  }, /Blender asset hash mismatch/);

  return { schema: 1, id: 'LW-SHADE-001', passed: true, cases };
}
