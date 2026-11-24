import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

test('Blender GLB is compact, self-contained and uses the runtime bind span', async () => {
  const bytes = await readFile(new URL('../src/assets/blender-tentacle.glb', import.meta.url));
  assert.ok(bytes.length < 220_000);
  const {scene, parser} = await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer, '');
  assert.equal(scene.children.length, 5);
  assert.equal(parser.json.images, undefined);
  assert.deepEqual(scene.children.map(({material}) => material.name).sort(),
    ['Amber', 'Brass', 'Brushed blue steel', 'Graphite', 'Polished chrome']);

  for (const mesh of scene.children) {
    const {index, attributes: {position, normal}} = mesh.geometry;
    assert.ok(mesh.matrixWorld.equals(scene.matrixWorld));
    assert.equal(index.count % 3, 0);
    assert.equal(normal.count, position.count);
    assert.ok(index.array.every(value => value < position.count));
    assert.ok(position.array.every(Number.isFinite));
    assert.ok(normal.array.every(Number.isFinite));
    mesh.geometry.computeBoundingBox();
    const {min, max} = mesh.geometry.boundingBox;
    assert.ok(min.y >= -1e-6 && max.y <= 4.350001);
    assert.ok(min.x >= -0.5 && max.x <= 0.5 && min.z >= -0.5 && max.z <= 0.5);
  }
});
