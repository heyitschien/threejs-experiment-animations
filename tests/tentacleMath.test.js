import test from 'node:test';
import assert from 'node:assert/strict';
import { ARM_COUNT, ARM_SEGMENTS, armPoint, armRadius, smoothstep } from '../src/tentacleMath.js';

test('eight articulated arms with adequate geometry resolution', () => {
  assert.equal(ARM_COUNT, 8);
  assert.ok(ARM_SEGMENTS >= 16);
});

test('arm coordinates remain finite throughout animation', () => {
  for (let i = 0; i < ARM_COUNT; i++) {
    for (let time = 0; time < 30; time += 1.5) {
      for (let s = 0; s <= ARM_SEGMENTS; s++) {
        const p = armPoint(i, s / ARM_SEGMENTS, time);
        assert.equal(p.length, 3);
        p.forEach(v => assert.ok(Number.isFinite(v), `arm ${i} invalid`));
      }
    }
  }
});

test('arms extend away from their mounting positions', () => {
  for (let i = 0; i < ARM_COUNT; i++) {
    const a = armPoint(i, 0, 0), b = armPoint(i, 0.5, 0);
    assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) > 1.0);
  }
});

test('tip shells taper and have no negative radius', () => {
  assert.ok(armRadius(0) > armRadius(0.5));
  assert.ok(armRadius(0.5) > armRadius(1));
  assert.ok(armRadius(1) > 0);
});

test('smoothstep clamps at endpoints', () => {
  assert.equal(smoothstep(0.1, 0.8, -1), 0);
  assert.equal(smoothstep(0.1, 0.8, 2), 1);
});

test('arm roots stay seated and adjacent links remain separated through motion', () => {
  for (let i = 0; i < ARM_COUNT; i++) {
    const root = armPoint(i, 0);
    for (let time = 0; time < 15; time += 0.25) {
      assert.ok(armPoint(i, 0, time).every((value, axis) => value === root[axis]));
      let point = root;
      for (let s = 1; s <= ARM_SEGMENTS; s++) {
        const next = armPoint(i, s / ARM_SEGMENTS, time);
        assert.ok(Math.hypot(...next.map((value, axis) => value - point[axis])) > 0.005);
        point = next;
      }
    }
  }
});
