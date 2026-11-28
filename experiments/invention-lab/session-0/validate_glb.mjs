import fs from 'node:fs/promises';
import path from 'node:path';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const artifactDir = path.resolve(process.argv[2]);
const cad = JSON.parse(await fs.readFile(path.join(artifactDir, 'cad-metrics.json'), 'utf8'));
const blender = JSON.parse(await fs.readFile(path.join(artifactDir, 'blender-metrics.json'), 'utf8'));
const loader = new GLTFLoader();
const results = [];

for (const model of cad.models) {
  const bytes = await fs.readFile(path.join(artifactDir, `${model.id}.glb`));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await loader.parseAsync(buffer, '');
  gltf.scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(gltf.scene);
  const sizeM = box.getSize(new Vector3());
  const sizeThreeMm = [sizeM.x, sizeM.y, sizeM.z].map((value) => value * 1000);
  const expectedCadMm = model.expected_dimensions_mm;
  const expectedThreeMm = [expectedCadMm[0], expectedCadMm[2], expectedCadMm[1]];
  const errorsMm = sizeThreeMm.map((value, index) => Math.abs(value - expectedThreeMm[index]));
  const maxDimensionErrorMm = Math.max(...errorsMm);
  const passed = maxDimensionErrorMm <= cad.integration_threshold_mm;
  if (!passed) {
    throw new Error(`${model.id}: GLB bounds error ${maxDimensionErrorMm} mm`);
  }
  results.push({
    id: model.id,
    expected_cad_dimensions_mm_xyz: expectedCadMm,
    expected_three_dimensions_mm_xyz: expectedThreeMm,
    measured_three_dimensions_mm_xyz: sizeThreeMm,
    axis_errors_mm: errorsMm,
    max_dimension_error_mm: maxDimensionErrorMm,
    passed,
  });
}

const report = {
  schema_version: 1,
  three_version: '0.187.0',
  axis_mapping: 'CAD X/Y/Z -> Three.js X/Z/Y; CAD Z-up becomes glTF/Three.js Y-up',
  integration_threshold_mm: cad.integration_threshold_mm,
  upstream_blender_passed: blender.passed,
  models: results,
  passed: results.every((result) => result.passed),
};
await fs.writeFile(path.join(artifactDir, 'glb-metrics.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
