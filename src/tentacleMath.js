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
  const path = new ArmPath();
  path.begin(((index % ARM_COUNT) + ARM_COUNT) % ARM_COUNT, time);
  return path.sample({set(x, y, z) { return [x, y, z === 0 ? 0 : z]; }}, Math.max(0, Math.min(1, t)));
}

export function armRadius(t) {
  // A substantial shoulder, long taper, and a small closed tip.
  return 0.027 + 0.269 * (1 - Math.max(0, Math.min(1, t))) ** 0.85;
}

const CURL_START = 0.59;
const curlAngles = [3.55, 3.87, 3.76, 3.82, 3.43, 3.16, 3.45, 3.36];

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
    this.curlAngle = curlAngles[index] + 0.27 * Math.sin(this.phase - 6.2);
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
