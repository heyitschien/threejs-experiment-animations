import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { heroFraming, HERO_FOV } from '../src/heroFraming.js';
import { Octopus } from '../src/octopus.js';

test('hero framing keeps the animated arm shells inside desktop and phone viewports', () => {
  const octopus = new Octopus(new THREE.Scene());
  const point = new THREE.Vector3();
  try {
    for (const [width, height, compact] of [[1440, 900, false], [360, 481, true], [390, 481, true]]) {
      const frame = heroFraming(width, height, compact);
      const camera = new THREE.PerspectiveCamera(HERO_FOV, width / height, 0.1, 100);
      camera.position.fromArray(frame.position);
      camera.lookAt(...frame.target);
      camera.updateMatrixWorld();
      for (let time = 0; time <= 24; time += 0.25) {
        octopus.update(time);
        octopus.root.updateMatrixWorld(true);
        for (const arm of octopus.sculpted.arms) {
          const positions = arm.geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(octopus.root.matrixWorld).project(camera);
            const x = (point.x + 1) * width / 2;
            const y = (1 - point.y) / 2;
            assert.ok(x > 8 && x < width - 8, `arm side margin at ${width}px, ${time}s`);
            assert.ok(y > (compact ? 0.13 : 0) && y < (compact ? 0.83 : 1),
              `arm vertical margin at ${width}px, ${time}s`);
          }
        }
      }
    }
  } finally {
    octopus.dispose();
  }
});
