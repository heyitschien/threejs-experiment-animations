import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cadBounds, demand, measureScene, measureTriangles, readStl, sceneBounds, toScene, vectorNear } from './geometry.mjs';

export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const bytes = (dir, file) => readFile(join(dir, file));
export const json = async (dir, file) => JSON.parse(await bytes(dir, file));
export const digest = async (dir, file) => hash(await bytes(dir, file));
export const pins = {
  python: '3.12.12', uv: '0.6.9', cadquery: '2.8.0', ocp: '7.9.3.1',
  blender: '4.4.0', blender_build: '05377985c527', blender_python: '3.11.11',
  node: '26.13.0', npm: '11.20.0', three: '0.187.0', playwright: '1.65.1',
  chromium: '159.0.8154.6',
};

function stage(report, metadata, models, label) {
  demand(report?.schema === 1 && report.passed === true && report.run_id === metadata.run_id,
    `${label}: invalid schema, failed stage or stale run ID`);
  const ids = Array.isArray(report.models) ? report.models.map((model) => model?.id).sort() : [];
  demand(ids.length > 0 && JSON.stringify(ids) === JSON.stringify(models.map((m) => m.id).sort()),
    `${label}: unexpected model-ID set`);
  return new Map(report.models.map((model) => [model.id, model]));
}

function checkBounds(actual, expected, limit, label) {
  demand(Array.isArray(actual) && actual.length === 2, `${label}: invalid bounds`);
  return Math.max(...actual.map((v, i) => vectorNear(v, expected[i], limit, label)));
}

export async function verifyGeometry(out, metadata, spec, runtimeThree) {
  const { REVISION } = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  demand(spec.schema === 1 && spec.cad_units === 'mm' && spec.scene_units === 'm' &&
    spec.cad_to_scene === '[x,z,-y]' && spec.threshold_mm === 0.5, 'Invalid unit or axis contract');
  demand(runtimeThree === pins.three && REVISION === '187', 'Unexpected Three.js runtime version');
  const cad = await json(out, 'cad.json');
  const blender = await json(out, 'blender.json');
  const cadModels = stage(cad, metadata, spec.models, 'CAD');
  const blenderModels = stage(blender, metadata, spec.models, 'Blender');
  demand(cad.units === 'mm' && cad.spec_sha256 === await digest(out, 'spec.json') &&
    cad.python === pins.python && cad.cadquery === pins.cadquery && cad.ocp === pins.ocp,
  'CAD: units, version or spec provenance mismatch');
  demand(blender.input_units === 'mm' && blender.scene_units === 'm' && blender.export_axes === '[x,z,-y]' &&
    blender.blender === pins.blender && blender.build === pins.blender_build &&
    blender.python === pins.blender_python && blender.cad_sha256 === await digest(out, 'cad.json'),
  'Blender: units, version or CAD provenance mismatch');
  const models = [];
  const loader = new GLTFLoader();
  for (const model of spec.models) {
    const { id, size, pocket_min: pocket } = model;
    const cq = cadModels.get(id);
    const blend = blenderModels.get(id);
    const product = (values) => values.reduce((a, b) => a * b, 1);
    const volume = product(size) - product(model.pocket_size);
    for (const [name, record] of [['CAD', cq.cad], ['STEP', cq.step]]) {
      demand(record.valid === true && record.solids === 1 && Number.isFinite(record.volume_mm3) &&
        Math.abs(record.volume_mm3 - volume) <= 1e-6, `${id} ${name}: invalid solid or volume`);
      checkBounds(record.bounds_mm, cadBounds(model), 1e-5, `${id} ${name}`);
      vectorNear(record.pocket_corner_mm, pocket, 1e-5, `${id} ${name} landmark`);
    }
    const stl = await bytes(out, `${id}.stl`);
    const glb = await bytes(out, `${id}.glb`);
    const glbHash = hash(glb);
    demand(cq.step_sha256 === await digest(out, `${id}.step`) && cq.stl_sha256 === hash(stl) &&
      blend.passed === true && blend.stl_sha256 === cq.stl_sha256 && blend.glb_sha256 === glbHash,
    `${id}: STEP/STL/GLB provenance mismatch`);
    const blendError = Math.max(
      checkBounds(blend.bounds_mm, cadBounds(model), spec.threshold_mm, `${id} Blender`),
      vectorNear(blend.pocket_corner_mm, pocket, spec.threshold_mm, `${id} Blender landmark`),
    );
    const stlScene = measureTriangles(readStl(stl.buffer.slice(stl.byteOffset, stl.byteOffset + stl.byteLength))
      .map((triangle) => triangle.map(toScene)), sceneBounds(model), toScene(pocket), spec.threshold_mm, `${id} STL`);
    const { scene } = await loader.parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '');
    const { triangle_keys, ...measurement } = measureScene(scene, model, spec.threshold_mm);
    demand(blend.triangles === measurement.triangles &&
      JSON.stringify(stlScene.triangle_keys) === JSON.stringify(triangle_keys), `${id}: STL/GLB surface or winding changed`);
    models.push({ ...model, glb_sha256: glbHash, volume_mm3: volume,
      blender_error_mm: blendError, measured: measurement });
  }
  return { schema: 1, run_id: metadata.run_id, passed: true, three: runtimeThree, spec, models };
}
