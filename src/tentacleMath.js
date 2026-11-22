/** Deterministic centerlines for eight mechanical arms. */
export const ARM_COUNT = 8;
export const ARM_SEGMENTS = 20;
export const TAU = Math.PI * 2;

// Starting angle, sweep, reach and depth, ordered around the body.
const arms = [
  [-2.72, -0.77, 3.70, -1.1],
  [-2.27, -0.37, 3.84, 0.55],
  [-1.89, -0.12, 3.33, 1.08],
  [-1.30,  0.44, 3.56, 1.65],
  [-0.91,  0.52, 3.83, 0.70],
  [-0.53,  0.77, 3.63, -0.38],
  [-0.17,  0.73, 2.98, -1.45],
  [-3.03, -1.26, 3.44, -1.95],
];

export function smoothstep(a, b, value) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function armPoint(index, t, time = 0) {
  const point = {set(x, y, z) { return [x, y, z]; }};
  return sampleArmPoint(point, index, t, time, false);
}

export function sampleArmPoint(out, index, t, time = 0, sculpted = true) {
  const i = ((index % ARM_COUNT) + ARM_COUNT) % ARM_COUNT;
  const [angle, sweep, reach, depth] = arms[i];
  const p = Math.max(0, Math.min(1, t));
  const sign = i < 3 || i === 7 ? -1 : 1;
  const phase = time * (0.68 + i * 0.036) + i * 1.37 - p * 6;
  const wave = Math.sin(phase);
  const travel = sculpted ? wave * smoothstep(0, 0.45, p) : wave;
  const follow = sculpted ? Math.sin(phase - 0.65) * smoothstep(0.42, 0.92, p) : 0;
  const tip = Math.max(0, (p - 0.49) / 0.51);
  const curl = sculpted ? tip * tip * (2 - tip) : smoothstep(0.49, 1, p);
  const theta = angle + sweep * smoothstep(0.04, 0.66, p) + travel * p * 0.12;
  const radius = sculpted
    ? 0.49 + reach * Math.sin(p * 1.45) - 0.24 * curl
    : 0.49 + reach * Math.sin(p * 1.58) - 0.48 * curl;
  const loop = Math.PI * (sculpted
    ? (1.24 + 0.11 * Math.sin(phase - 0.7) + 0.03 * follow)
    : (1.32 + 0.14 * Math.sin(phase - 0.7))) * curl;
  const loopRadius = (0.72 - 0.25 * p) * smoothstep(0.34, 0.69, p);
  const along = radius + loopRadius * Math.sin(loop);
  const across = sign * loopRadius * (1 - Math.cos(loop));
  return out.set(
    along * Math.cos(theta) - across * Math.sin(theta),
    -0.31 + along * Math.sin(theta) + across * Math.cos(theta) + travel * p * 0.09,
    depth * Math.sin(p * 2.2) + 0.23 * p * Math.cos(phase) + follow * 0.10,
  );
}

export function armRadius(t) {
  return 0.255 * Math.pow(1 - Math.max(0, Math.min(1, t)), 0.87) + 0.027;
}

const CURL_START = 0.59;

// Cache the moving transition point and tangent once per arm per pose.
export class ArmPath {
  constructor() {
    this.join = {x: 0, y: 0, set(x, y) { this.x = x; this.y = y; }};
    this.near = {x: 0, y: 0, set: this.join.set};
  }

  begin(index, time) {
    const [angle, sweep, reach, depth] = arms[index];
    this.angle = angle;
    this.sweep = sweep;
    this.reach = reach;
    this.depth = depth;
    this.phase = time * (0.68 + index * 0.036) + index * 1.37;
    this.sign = index < 3 || index === 7 ? -1 : 1;
    this.stem(this.join, CURL_START);
    this.stem(this.near, CURL_START - 0.001);
    const dx = this.join.x - this.near.x;
    const dy = this.join.y - this.near.y;
    const length = Math.hypot(dx, dy);
    this.tx = dx / length;
    this.ty = dy / length;
    this.curlAngle = 3.65 + 0.3 * Math.sin(this.phase - 6.2);
    this.curlRadius = 0.67 + 0.08 * Math.sin(this.phase - 4.8);
  }

  depthAt(p) {
    return this.depth * Math.sin(p * 2.2)
      + 0.20 * smoothstep(0, 0.78, p) * Math.cos(this.phase - 6 * p)
      + 0.10 * smoothstep(0.5, 1, p) * Math.sin(this.phase - 6.65 * p);
  }

  stem(out, p) {
    const wave = Math.sin(this.phase - 6 * p) * smoothstep(0, 0.55, p);
    const theta = this.angle + this.sweep * smoothstep(0.04, 0.66, p) + wave * p * 0.10;
    const radius = 0.49 + this.reach * Math.sin(p * 1.5);
    return out.set(radius * Math.cos(theta), -0.31 + radius * Math.sin(theta) + wave * p * 0.08, this.depthAt(p));
  }

  sample(out, p) {
    if (p <= CURL_START) return this.stem(out, p);
    const u = (p - CURL_START) / (1 - CURL_START);
    const angle = this.curlAngle * u;
    const along = this.curlRadius * Math.sin(angle) + 0.21 * (1 - Math.exp(-6 * u));
    const side = this.sign * this.curlRadius * (1 - Math.cos(angle));
    return out.set(this.join.x + along * this.tx - side * this.ty,
      this.join.y + along * this.ty + side * this.tx, this.depthAt(p));
  }
}
