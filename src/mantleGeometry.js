import * as THREE from 'three';

const RINGS = 40;
const SIDES = 48;
const WINDOW = {bottom: 16, top: 34, left: 16, right: 32};

// Local centerline and cross-section radii from socket to crown.
const profile = [
  // x, y, z, half-width, half-depth
  [-0.19, -0.99, -0.12, 0.31, 0.31],
  [-0.27, -0.72, -0.06, 0.53, 0.48],
  [-0.25, -0.35, -0.02, 0.58, 0.55],
  [-0.12,  0.00, -0.04, 0.60, 0.59],
  [ 0.02,  0.36, -0.10, 0.75, 0.67],
  [ 0.15,  0.74, -0.19, 0.86, 0.73],
  [ 0.24,  1.10, -0.24, 0.83, 0.74],
  [ 0.24,  1.43, -0.24, 0.65, 0.61],
  [ 0.18,  1.67, -0.21, 0.36, 0.36],
  [ 0.12,  1.77, -0.18, 0.045, 0.045],
];

const spline = points => new THREE.CatmullRomCurve3(points, false, 'catmullrom');
const centerline = spline(profile.map(([x,y,z]) => new THREE.Vector3(x,y,z)));
const sections = spline(profile.map(([, , ,x,z]) => new THREE.Vector3(x,z,0)));

function surface(ring, side, offset = 0) {
  const t = ring / RINGS;
  const v = THREE.MathUtils.clamp((ring - WINDOW.bottom) / (WINDOW.top - WINDOW.bottom), 0, 1);
  const half = 0.11 + 1.08 * Math.sin(Math.PI * v) ** 0.72;
  const mid = 0.28 + 0.28 * v;
  const s = (side - WINDOW.left) / (WINDOW.right - WINDOW.left);
  const azimuth = s < 0 ? THREE.MathUtils.lerp(-Math.PI, -half, side / WINDOW.left)
    : s <= 1 ? THREE.MathUtils.lerp(-half, half, s)
    : THREE.MathUtils.lerp(half, Math.PI, (side - WINDOW.right) / (SIDES - WINDOW.right));
  const angle = mid + azimuth;
  const center = centerline.getPoint(t);
  const radii = sections.getPoint(t);
  const rib = 1 + 0.045 * Math.cos(3 * (angle - 0.18)) * Math.sin(Math.PI * t);
  return center.add(new THREE.Vector3(
    (radii.x * rib + offset) * Math.sin(angle), 0, (radii.y * rib + offset) * Math.cos(angle),
  ));
}

function indexed(points, indices) {
  const mesh = new THREE.BufferGeometry();
  mesh.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap(point => point.toArray()), 3));
  mesh.setIndex(indices);
  mesh.computeVertexNormals();
  return mesh;
}

export function createMantle() {
  const points = [];
  const faces = [];
  const at = (ring, side) => ring * SIDES + side % SIDES;
  for (let ring = 0; ring <= RINGS; ring++) {
    for (let side = 0; side < SIDES; side++) points.push(surface(ring, side));
  }
  for (let ring = 0; ring < RINGS; ring++) {
    for (let side = 0; side < SIDES; side++) {
      if (ring >= WINDOW.bottom && ring < WINDOW.top && side >= WINDOW.left && side < WINDOW.right) continue;
      const a = at(ring, side), b = at(ring, side + 1);
      const c = at(ring + 1, side), d = at(ring + 1, side + 1);
      faces.push(a,b,c,b,d,c);
    }
  }
  for (const ring of [0, RINGS]) {
    const pole = points.push(centerline.getPoint(ring / RINGS)) - 1;
    for (let side = 0; side < SIDES; side++) {
      const a = at(ring, side), b = at(ring, side + 1);
      if (ring === 0) faces.push(pole,b,a);
      else faces.push(pole,a,b);
    }
  }
  const opening = [];
  for (let s = WINDOW.left; s < WINDOW.right; s++) opening.push(points[at(WINDOW.bottom, s)]);
  for (let r = WINDOW.bottom; r < WINDOW.top; r++) opening.push(points[at(r, WINDOW.right)]);
  for (let s = WINDOW.right; s > WINDOW.left; s--) opening.push(points[at(WINDOW.top, s)]);
  for (let r = WINDOW.top; r > WINDOW.bottom; r--) opening.push(points[at(r, WINDOW.left)]);
  // Compact away unused vertices inside the window before calculating normals.
  const remap = new Map();
  const used = [];
  for (const i of faces) {
    if (!remap.has(i)) remap.set(i, used.push(points[i]) - 1);
  }
  return {shell: indexed(used, faces.map(i => remap.get(i))), opening};
}

export function apertureSurface(opening, center, profile) {
  const points = [];
  const faces = [];
  const count = opening.length;
  for (const [radius, depth] of profile) {
    for (const rim of opening) {
      const point = center.clone().lerp(rim, radius);
      point.z += depth;
      points.push(point);
    }
  }
  for (let row = 0; row < profile.length - 1; row++) {
    for (let i = 0; i < count; i++) {
      const a = row * count + i, b = row * count + (i + 1) % count;
      faces.push(a,b,a+count,b,b+count,a+count);
    }
  }
  const pole = points.push(center.clone()) - 1;
  const last = (profile.length - 1) * count;
  for (let i = 0; i < count; i++) faces.push(last+i,last+(i+1)%count,pole);
  return indexed(points, faces);
}

export function armorStrip(from, to, middle, spread, offset) {
  const points = [];
  const faces = [];
  const columns = 10;
  for (let i = 0; i <= 26; i++) {
    const u = i / 26;
    const ring = THREE.MathUtils.lerp(from, to, u);
    const half = spread * (0.11 + 0.89 * Math.sin(Math.PI * u) ** 0.7);
    for (let j = 0; j <= columns; j++) {
      const side = middle(u) + (j / columns * 2 - 1) * half;
      points.push(surface(ring, (side + SIDES) % SIDES, offset));
    }
    if (i === 26) continue;
    for (let j = 0; j < columns; j++) {
      const a = i * (columns+1) + j, b = a + 1, c = a + columns + 1;
      faces.push(a,b,c,b,c+1,c);
    }
  }
  return indexed(points, faces);
}
