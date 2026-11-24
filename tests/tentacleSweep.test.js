import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { ARM_COUNT, armPoint } from '../src/tentacleMath.js';
import { PANEL_COUNT, RING_STEPS, SIDES, TentacleSweep } from '../src/tentacleSweep.js';

test('the indexed sweep is closed, with opposite winding on shared edges', () => {
  const {geometry} = new TentacleSweep();
  const indices = geometry.index.array;
  const edges = new Map();
  const vertexCount = geometry.attributes.position.count;
  assert.equal(vertexCount, (RING_STEPS + 1) * SIDES + 2);
  assert.equal(geometry.groups.reduce((length, group) => length + group.count, 0), indices.length);
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.subarray(i, i + 3);
    assert.equal(new Set(triangle).size, 3);
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge];
      const b = triangle[(edge + 1) % 3];
      assert.ok(a < vertexCount);
      const key = a < b ? a * vertexCount + b : b * vertexCount + a;
      const pair = edges.get(key) ?? {faces: 0, orientation: 0};
      pair.faces++;
      pair.orientation += a < b ? 1 : -1;
      edges.set(key, pair);
    }
  }
  for (const {faces, orientation} of edges.values()) {
    assert.equal(faces, 2);
    assert.equal(orientation, 0);
  }
});

test('all eight sweeps maintain seated roots, finite outward normals and smooth taper through motion', () => {
  const sweep = new TentacleSweep();
  const index = sweep.geometry.index.array;
  const start = new Vector3();
  const edgeA = new Vector3();
  const edgeB = new Vector3();
  const surfaceNormal = new Vector3();
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const root = new Vector3(...armPoint(arm, 0));
    for (let time = 0; time <= 24; time += 0.25) {
      sweep.update(arm, time);
      assert.ok(sweep.centers[0].distanceTo(root) < 1e-12);
      assert.ok(sweep.centers.at(-1).distanceTo(new Vector3(...armPoint(arm, 1, time))) < 1e-9);
      assert.ok(sweep.positions.every(Number.isFinite));
      assert.ok(sweep.normals.every(Number.isFinite));

      for (let i = 0; i < sweep.normals.length; i += 3) {
        assert.ok(Math.abs(surfaceNormal.fromArray(sweep.normals, i).lengthSq() - 1) < 1e-6);
      }

      for (let ring = 1; ring <= RING_STEPS; ring++) {
        const length = sweep.centers[ring].distanceTo(sweep.centers[ring - 1]);
        assert.ok(length > sweep.arc.at(-1) * 0.0013, 'ring spacing collapses');
        assert.ok(length < sweep.arc.at(-1) * 0.025, 'ring spacing jumps');
        assert.ok(sweep.radii[ring] > 0);
        assert.ok(sweep.tangents[ring].dot(sweep.tangents[ring - 1]) > 0.95);
        assert.ok(sweep.undersides[ring].dot(sweep.undersides[ring - 1]) > 0.95);
      }
      const ringsPerPanel = RING_STEPS / PANEL_COUNT;
      for (let ring = 0; ring < RING_STEPS; ring += ringsPerPanel) {
        assert.ok(sweep.radii[ring] > sweep.radii[ring + ringsPerPanel]);
      }

      for (let i = 0; i < index.length; i += 3) {
        const [a, b, c] = index.subarray(i, i + 3);
        start.fromArray(sweep.positions, a * 3);
        edgeA.fromArray(sweep.positions, b * 3).sub(start);
        edgeB.fromArray(sweep.positions, c * 3).sub(start);
        surfaceNormal.fromArray(sweep.normals, a * 3);
        assert.ok(edgeA.cross(edgeB).dot(surfaceNormal) > 0, `inverted face on arm ${arm}, pose ${time}`);
      }
    }
  }
});

test('sampled nonlocal curls and separate arms clear their swept envelopes outside the root cluster', () => {
  const sweeps = Array.from({length: ARM_COUNT}, () => new TentacleSweep());
  const assertClear = (a, b, i, j) => assert.ok(
    a.centers[i].distanceToSquared(b.centers[j]) > (a.radii[i] + b.radii[j]) ** 2,
    'sampled envelopes overlap outside the expected joining region',
  );
  for (let time = 0; time <= 24; time += 0.25) {
    sweeps.forEach((sweep, arm) => {
      sweep.update(arm, time);
      for (let i = 10; i <= RING_STEPS; i++) {
        for (let j = 0; j <= i - 10; j++) assertClear(sweep, sweep, i, j);
      }
    });
    for (let arm = 0; arm < ARM_COUNT; arm++) {
      for (let other = arm + 1; other < ARM_COUNT; other++) {
        for (let i = 13; i <= RING_STEPS; i++) {
          for (let j = 13; j <= RING_STEPS; j++) assertClear(sweeps[arm], sweeps[other], i, j);
        }
      }
    }
  }
});
