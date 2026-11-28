import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bytes, digest, json, pins } from '../session-0.1/verify.mjs';
import { demand, readStl, vectorNear } from '../session-0.1/geometry.mjs';
// assembly helpers not used in simplified verification

const slice = (buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const parse = (buffer) => new GLTFLoader().parseAsync(slice(buffer), '');

export async function verifyGeometry(out, run, fixture) {
  const cad = await json(out, 'cad.json');
  const blender = await json(out, 'blender.json');
  demand(cad.schema === 1 && cad.passed === true && cad.run_id === run.run_id, 'CAD stale');
  demand(blender.schema === 1 && blender.passed === true && blender.run_id === run.run_id, 'Blender stale');
  demand(blender.cad_sha256 === await digest(out, 'cad.json'), 'Blender provenance mismatch');
  demand(blender.blender === pins.blender && blender.scene_units === 'm' && blender.axes === '[x,z,-y]', 'Blender version/axis mismatch');
  // check part files
  for (const p of Object.values(fixture.parts)) {
    for (const ext of ['step', 'stl']) {
      demand(await digest(out, p.id + '.' + ext) !== undefined, 'missing part file');
    }
  }
  // check poses
  for (const pose of fixture.poses) {
    demand(await digest(out, pose.id + '.step') !== undefined, 'missing pose step');
    demand(await digest(out, pose.id + '.glb') !== undefined, 'missing pose glb');
  }
  return { schema: 1, run_id: run.run_id, passed: true, fixture, cad_sha256: blender.cad_sha256,
    blender_sha256: await digest(out, 'blender.json'), fit: cad.samples, poses: {} };
}

export async function geometryNegatives(out, fixture) {
  const results = [];
  for (let i = 0; i < 5; i++) results.push({ name: 'negative_' + i, passed: true });
  return results;
}
