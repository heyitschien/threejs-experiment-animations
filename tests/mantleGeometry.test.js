import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { apertureSurface, armorStrip, createMantle } from '../src/mantleGeometry.js';
import { Octopus } from '../src/octopus.js';
import { ARM_COUNT, armPoint } from '../src/tentacleMath.js';

function validateMesh(geometry) {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const {index} = geometry;
  assert.equal(position.count, normal.count);
  assert.ok(position.array.every(Number.isFinite));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < normal.count; i++) {
    assert.ok(Math.abs(n.fromBufferAttribute(normal, i).lengthSq() - 1) < 1e-5);
  }
  for (let i = 0; i < index.count; i += 3) {
    const x = index.getX(i), y = index.getX(i + 1), z = index.getX(i + 2);
    assert.ok(Math.max(x, y, z) < position.count);
    a.fromBufferAttribute(position, x);
    b.fromBufferAttribute(position, y).sub(a);
    c.fromBufferAttribute(position, z).sub(a);
    assert.ok(b.cross(c).lengthSq() > 1e-14, 'nondegenerate triangle');
  }
}

test('the mantle has one aperture, with a consistently wound shell and end caps', () => {
  const {shell, opening} = createMantle();
  validateMesh(shell);
  const {array} = shell.index;
  const edges = new Map();
  for (let i = 0; i < array.length; i += 3) {
    for (let edge = 0; edge < 3; edge++) {
      const a = array[i + edge], b = array[i + (edge + 1) % 3];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const count = edges.get(key) ?? {uses: 0, winding: 0};
      count.uses++;
      count.winding += a < b ? 1 : -1;
      edges.set(key, count);
    }
  }
  let rimEdges = 0;
  for (const {uses, winding} of edges.values()) {
    if (uses === 1) rimEdges++;
    else assert.deepEqual([uses, winding], [2, 0]);
  }
  assert.equal(rimEdges, opening.length);
  const p = shell.getAttribute('position');
  let top = 0, bottom = 0;
  for (let i = 1; i < p.count; i++) {
    if (p.getY(i) > p.getY(top)) top = i;
    if (p.getY(i) < p.getY(bottom)) bottom = i;
  }
  const n = shell.getAttribute('normal');
  assert.ok(n.getY(top) > 0);
  assert.ok(n.getY(bottom) < 0);
});

test('aperture surfaces and a seam-crossing armor strip have finite normals and valid topology', () => {
  const {opening} = createMantle();
  const center = new THREE.Vector3(0.38, 0.94, 0.58);
  const glass = apertureSurface(opening, center, [[1, -0.014], [0.62, 0.032], [0.17, 0.015]]);
  validateMesh(glass);
  validateMesh(armorStrip(3, 37, u => 47 + 1.8 * u, 5.4, 0.058));
  const normals = glass.getAttribute('normal');
  assert.ok(normals.getZ(normals.count - 1) > 0);
});

test('the animated mantle neck and all eight sockets remain seated in the bearing', () => {
  const scene = new THREE.Scene();
  const octopus = new Octopus(scene);
  const bearing = octopus.root.getObjectByName('Mantle bearing').children[0];
  const radii = bearing.scale.clone().multiplyScalar(bearing.geometry.parameters.radius);
  const inside = point => point.sub(bearing.position).divide(radii).lengthSq() < 1;
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const socketContact = new THREE.Vector3(...armPoint(arm, 0)).lerp(bearing.position, 0.29);
    assert.ok(inside(socketContact), `seated socket ${arm + 1}`);
  }
  const shell = octopus.head.children[0].geometry;
  shell.computeBoundingBox();
  const points = shell.attributes.position;
  const neckCenter = new THREE.Vector3();
  const point = new THREE.Vector3();
  let neckVertices = 0;
  for (let i = 0; i < points.count; i++) {
    if (points.getY(i) !== shell.boundingBox.min.y) continue;
    neckCenter.add(point.fromBufferAttribute(points, i));
    neckVertices++;
  }
  assert.ok(neckVertices > 0);
  neckCenter.divideScalar(neckVertices);
  for (let time = 0; time <= 24; time += 0.25) {
    octopus.update(time);
    const position = octopus.root.worldToLocal(octopus.head.localToWorld(neckCenter.clone()));
    assert.ok(inside(position), `seated neck at ${time} seconds`);
  }
  octopus.dispose();
});
