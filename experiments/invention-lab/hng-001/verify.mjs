import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bytes, digest, json, pins } from '../session-0.1/verify.mjs';
import { demand, readStl, vectorNear } from '../session-0.1/geometry.mjs';
import { assemblyNodes, compareSurface, fromCad, measurePose, meshTriangles } from './assembly.mjs';

const keys = (obj, expected, label) => demand(
  obj && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...expected].sort()), `${label}: unexpected IDs`);
const slice = (buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const parse = (buffer) => new GLTFLoader().parseAsync(slice(buffer), '');
const validateStage = (report, run, stage) => demand(
  report.schema === 1 && report.passed === true && report.run_id === run.run_id, `${stage}: stale or failed stage`);
const within = (a, b, tol, label) => demand(Number.isFinite(a) && Math.abs(a - b) <= tol, label);

export async function verifyGeometry(out, run, fixture) {
  const cad = await json(out, 'cad.json');
  const blender = await json(out, 'blender.json');
  const { fixed, moving } = fixture.parts;
  const ids = [fixed.id, moving.id];
  const poseIds = fixture.poses.map((p) => p.id);
  const tolerance = fixture.tolerances;
  validateStage(cad, run, 'CAD');
  validateStage(blender, run, 'Blender');
  demand(cad.fixture_sha256 === await digest(out, 'fixture.json') &&
    cad.units === 'mm' && cad.root === fixture.root &&
    JSON.stringify(cad.joint) === JSON.stringify(fixture.joint), 'Invalid CAD fixture hash, units or joint');
  demand(blender.cad_sha256 === await digest(out, 'cad.json') &&
    blender.blender === pins.blender && blender.build === pins.blender_build &&
    blender.python === pins.blender_python && blender.scene_units === 'm' && blender.axes === '[x,z,-y]',
  'Blender provenance/version/axis mismatch');
  keys(cad.parts, ids, 'CAD parts');
  keys(cad.poses, poseIds, 'STEP poses');
  keys(blender.poses, poseIds, 'GLB poses');

  const stls = new Map();
  for (const part of [fixed, moving]) {
    const entry = cad.parts[part.id];
    for (const type of ['step', 'stl']) {
      demand(entry[`${type}_sha256`] === await digest(out, `${part.id}.${type}`), `${part.id} ${type} hash mismatch`);
    }
    for (const stage of ['cad', 'step']) {
      const record = entry[stage];
      demand(record.valid === true && record.solids === 1 && record.closed_shells === 1, 'Invalid solid');
      within(record.volume_mm3, part.volume, tolerance.volume_mm3, 'Invalid part volume');
      record.bounds_mm.forEach((v, i) => vectorNear(v, part.bounds[i], tolerance.cad_mm, 'Invalid part bounds'));
      vectorNear(record.witness_mm, part.witness, tolerance.witness_mm, 'Invalid part witness');
    }
    const stl = readStl(slice(await bytes(out, `${part.id}.stl`))).map((tri) => tri.map(fromCad));
    stls.set(part.id, stl);
  }
  for (const kind of ['step', 'stl']) {
    demand(cad.edit.moving[`${kind}_sha256`] === await digest(out, `moving_edited.${kind}`), 'Edited derivative hash mismatch');
  }
  const edited = readStl(slice(await bytes(out, 'moving_edited.stl')));
  const editedSurface = compareSurface(edited, edited, tolerance.oriented_triangle_coordinate_mm);
  demand(cad.edit.fixed_input_hashes_unchanged === true &&
    cad.edit.fixed_symmetric_difference_mm3 <= tolerance.volume_mm3 &&
    cad.edit.outside_edit_slab_mm3 <= tolerance.volume_mm3, 'Invalid or missing isolated edit result');
  within(cad.edit.added_mm3, fixture.edit.added_volume_mm3, tolerance.volume_mm3, 'Invalid edit volume');
  within(cad.fit.radial_gap_mm, fixture.fit.radial_gap, tolerance.cad_mm, 'Invalid radial gap');
  demand(cad.fit.axial_gaps_mm.length === 2 &&
    [cad.fit.keep_in_missing_mm3, cad.fit.keep_out_occupied_mm3].every((v) => v >= 0 && v <= tolerance.volume_mm3),
  'Missing axial gap or unresolved interface gauge');
  cad.fit.axial_gaps_mm.forEach((gap, i) => within(gap, fixture.fit.axial_gap[i], tolerance.cad_mm, 'Invalid axial gap'));
  const count = 90 / fixture.fit.sample_step_deg + 1;
  demand(cad.fit.samples.length === count && cad.fit.samples.every((s, i) =>
    s.angle_deg === i * fixture.fit.sample_step_deg && s.intersection_mm3 >= 0 &&
    s.intersection_mm3 <= tolerance.volume_mm3 && Math.abs(s.min_distance_mm - fixture.fit.radial_gap) <= tolerance.cad_mm),
  'Invalid or incomplete CAD interference sampling');
  const { contact, interference } = cad.controls;
  within(contact.radial_gap_mm, 0, tolerance.cad_mm, 'Invalid contact gap');
  within(contact.distance_mm, 0, tolerance.cad_mm, 'Invalid contact distance');
  within(contact.intersection_mm3, 0, tolerance.volume_mm3, 'Invalid contact overlap');
  keys(interference, ['undersize_bore', 'offset_x', 'offset_z'], 'Interference controls');
  demand(Object.values(interference).every((item) => item.nominal_rejected === true &&
    Number.isFinite(item.intersection_mm3) && item.intersection_mm3 > tolerance.volume_mm3) &&
    JSON.stringify(cad.controls.rejected_angles_deg) === JSON.stringify(fixture.fit.rejected_angles_deg) &&
    Number.isFinite(cad.controls.wrong_signed_pose_witness_error_mm) &&
    cad.controls.wrong_signed_pose_witness_error_mm > tolerance.witness_mm, 'Invalid or incomplete CAD negative control');
  within(interference.undersize_bore.intersection_mm3, fixture.fit.undersize_overlap_mm3,
    tolerance.control_overlap_mm3, 'Invalid undersized bore overlap');
  const poses = {};
  for (const pose of fixture.poses) {
    const step = cad.poses[pose.id], blend = blender.poses[pose.id];
    const stepDigest = await digest(out, `${pose.id}.step`);
    const glb = await bytes(out, `${pose.id}.glb`);
    demand(step.step_sha256 === stepDigest && blend.step_sha256 === stepDigest &&
      blend.glb_sha256 === await digest(out, `${pose.id}.glb`) &&
      step.angle_deg === pose.angle_deg && blend.angle_deg === pose.angle_deg,
    'Pose provenance mismatch');
    keys(step.parts, ids, 'Pose STEP occurrences');
    keys(blend.parts, ids, 'Pose Blender objects');
    const gltf = await parse(glb);
    const meshes = assemblyNodes(gltf, fixture, pose);
    const measurement = measurePose(gltf, fixture, pose);
    for (const [key, mesh] of Object.entries(meshes)) {
      const id = fixture.parts[key].id;
      const model = measurement[id];
      const triangleEvidence = compareSurface(stls.get(id), meshTriangles(mesh, false), tolerance.oriented_triangle_coordinate_mm);
      demand(triangleEvidence.triangles === blend.parts[id].triangles, 'Blender triangle count mismatch');
      const cadBounds = key === 'fixed' ? fixed.bounds : pose.moving_bounds;
      const cadWitness = key === 'fixed' ? fixed.witness : pose.moving_witness;
      blend.parts[id].bounds_mm.forEach((v, i) => vectorNear(v, cadBounds[i], tolerance.glb_mm, 'Blender bounds'));
      vectorNear(blend.parts[id].witness_mm, cadWitness, tolerance.glb_mm, 'Blender signed witness');
      model.surface = triangleEvidence;
    }
    poses[pose.id] = { angle_deg: pose.angle_deg, sha256: blend.glb_sha256, parts: measurement };
  }
  return { schema: 1, run_id: run.run_id, passed: true, fixture,
    cad_sha256: blender.cad_sha256, blender_sha256: await digest(out, 'blender.json'),
    fit: cad.fit, poses, edited_mesh: editedSurface };
}

export async function geometryNegatives(out, fixture) {
  const pose = fixture.poses[1];
  const loaded = await bytes(out, `${pose.id}.glb`);
  const results = [];
  async function rejects(name, mutate, pattern) {
    const gltf = await parse(loaded);
    const meshes = assemblyNodes(gltf, fixture, pose);
    mutate(meshes);
    try { measurePose(gltf, fixture, pose); } catch (error) {
      demand(pattern.test(error.message), `${name}: unexpected failure: ${error.message}`);
      results.push({ name, passed: true });
      return;
    }
    throw new Error(`${name}: incorrectly accepted`);
  }
  await rejects('duplicate component ID', ({ fixed, moving }) => { moving.userData.part_id = fixed.userData.part_id; }, /Duplicate ID/);
  await rejects('reflected GLB', ({ moving }) => { moving.scale.x *= -1; }, /improper rotation/);
  await rejects('wrong signed pose', ({ moving }) => { moving.rotation.y *= -1; }, /signed transform/);
  const gltf = await parse(loaded);
  const { moving } = assemblyNodes(gltf, fixture, pose);
  const triangles = meshTriangles(moving, false);
  const reversed = [[...triangles[0]].reverse(), ...triangles.slice(1)];
  try { compareSurface(triangles, reversed, fixture.tolerances.oriented_triangle_coordinate_mm); } catch (error) {
    demand(/Oriented STL\/GLB triangles differ/.test(error.message), error.message);
    results.push({ name: 'one reversed triangle', passed: true });
  }
  demand(results.length === 4, 'Not every GLB negative failed closed');
  return results;
}
