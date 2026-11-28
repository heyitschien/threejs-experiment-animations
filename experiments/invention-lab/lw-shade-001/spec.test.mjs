import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const spec = JSON.parse(await readFile(new URL('./spec.json', import.meta.url)));
const endpoint = (theta, z = 0, crank = 20) => {
  const rad = theta * Math.PI / 180;
  return [crank * Math.cos(rad), z - crank * Math.sin(rad)];
};

test('independent analytic oracle closes all 13 parallelogram samples', () => {
  assert.equal(spec.motion.sample_angles_deg.length, 13);
  for (const theta of spec.motion.sample_angles_deg) {
    const c = endpoint(theta);
    const d = endpoint(theta, 80);
    assert.ok(Math.abs(Math.hypot(...c) - 20) <= spec.oracles.loop_closure_mm);
    assert.ok(Math.abs(Math.hypot(d[0], d[1] - 80) - 20) <= spec.oracles.loop_closure_mm);
    assert.ok(Math.abs(Math.hypot(d[0] - c[0], d[1] - c[1]) - 80) <= spec.oracles.loop_closure_mm);
    const angle = Math.atan2(-c[1], c[0]) * 180 / Math.PI;
    assert.ok(Math.abs(angle - theta) <= spec.oracles.angle_agreement_deg);
  }
});

test('wrong link and independently angled upper crank fail the loop oracle', () => {
  const theta = 25;
  const c = endpoint(theta);
  const dWrongLink = endpoint(theta, spec.oracles.incorrect_link_length_mm);
  assert.ok(Math.abs(Math.hypot(dWrongLink[0] - c[0], dWrongLink[1] - c[1]) - 80) > spec.oracles.loop_closure_mm);
  const dWrongPose = endpoint(theta + spec.oracles.wrong_upper_angle_offset_deg, 80);
  assert.ok(Math.abs(Math.hypot(dWrongPose[0] - c[0], dWrongPose[1] - c[1]) - 80) > spec.oracles.loop_closure_mm);
});

test('axial stack and named IDs freeze the intended clearances', () => {
  const stack = spec.joint.axial_stack_x_mm;
  assert.equal(stack.crank_to_coupler_gap[1] - stack.crank_to_coupler_gap[0], 0.5);
  assert.equal(stack.coupler_to_washer_gap[1] - stack.coupler_to_washer_gap[0], 0.5);
  assert.deepEqual([spec.joint.washer.id_mm, spec.joint.washer.od_mm, spec.joint.washer.thickness_mm], [3.2, 7, 0.5]);
  assert.equal(new Set(spec.parts.map(({ id }) => id)).size, 6);
  assert.deepEqual(spec.poses.map(({ angle_deg }) => angle_deg), [0, 25, 60]);
  assert.deepEqual(spec.oracles.rejected_angles_deg, [-1, 61, 90]);
});
