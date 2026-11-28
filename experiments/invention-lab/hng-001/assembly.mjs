import { Matrix3, Vector3 } from 'three';
import { demand, measureTriangles, toScene, vectorNear } from '../session-0.1/geometry.mjs';

export const fromCad = toScene;
const point = new Vector3();

export function assemblyNodes(gltf, fixture, pose) {
  const { scene } = gltf;
  const [root] = scene.children;
  demand(scene.children.length === 1 && root.name === fixture.root &&
    root.userData.assembly_id === fixture.root && root.children.length === 2 &&
    root.userData.joint_id === fixture.joint.id && root.userData.pose_id === pose.id &&
    root.userData.angle_deg === pose.angle_deg, 'Unexpected GLB assembly hierarchy or pose');
  vectorNear(root.userData.joint_axis_cad, fixture.joint.axis, 0, 'signed joint axis');
  const children = new Map();
  for (const mesh of root.children) {
    const id = mesh.userData.part_id;
    demand(mesh.isMesh && mesh.children.length === 0 && !children.has(id), 'Duplicate ID or non-leaf mesh');
    const definition = gltf.parser.json.nodes.find((node) => node.extras?.part_id === id);
    demand(definition?.name === id, 'Missing canonical GLB node name');
    children.set(id, mesh);
  }
  const { fixed, moving } = fixture.parts;
  demand(children.has(fixed.id) && children.has(moving.id), 'Wrong GLB component IDs');
  return { fixed: children.get(fixed.id), moving: children.get(moving.id) };
}

export function meshTriangles(mesh, world) {
  const { index, attributes: { position } } = mesh.geometry;
  const count = index?.count ?? position?.count;
  demand(position && count && count % 3 === 0, 'Missing or invalid GLB triangles');
  const triangles = [];
  for (let i = 0; i < count; i += 3) {
    triangles.push([i, i + 1, i + 2].map((n) => {
      point.fromBufferAttribute(position, index ? index.getX(n) : n);
      return (world ? point.applyMatrix4(mesh.matrixWorld).multiplyScalar(1000) : point).toArray();
    }));
  }
  return triangles;
}

function scaledBasis(mesh, angle, tolerance) {
  const matrix = mesh.matrixWorld;
  const e = matrix.elements;
  const basis = [0, 4, 8].map((i) => e.slice(i, i + 3).map((v) => v * 1000));
  const rad = angle * Math.PI / 180;
  const want = [[Math.cos(rad), 0, -Math.sin(rad)], [0, 1, 0], [Math.sin(rad), 0, Math.cos(rad)]];
  demand(Math.abs(new Matrix3().setFromMatrix4(matrix).determinant() * 1e9 - 1) <= tolerance,
    'GLB improper rotation or scale');
  basis.forEach((axis, i) => vectorNear(axis, want[i], tolerance, 'GLB signed transform basis'));
  vectorNear(e.slice(12, 15).map((v) => v * 1000), [0, 0, 0], tolerance, 'GLB pivot translation');
  return basis;
}

export function measurePose(gltf, fixture, pose) {
  gltf.scene.updateMatrixWorld(true);
  const result = {};
  const meshes = assemblyNodes(gltf, fixture, pose);
  for (const [key, mesh] of Object.entries(meshes)) {
    const part = fixture.parts[key];
    const [min, max] = key === 'fixed' ? part.bounds : pose.moving_bounds;
    const witness = key === 'fixed' ? part.witness : pose.moving_witness;
    const sceneBounds = [[min[0], min[2], -max[1]], [max[0], max[2], -min[1]]];
    const basis = scaledBasis(mesh, key === 'fixed' ? 0 : pose.angle_deg, fixture.tolerances.rigid_matrix);
    const { triangle_keys, ...measured } = measureTriangles(meshTriangles(mesh, true),
      sceneBounds, fromCad(witness), fixture.tolerances.glb_mm, part.id);
    result[part.id] = { ...measured, basis_scene: basis, matrix_world: mesh.matrixWorld.toArray() };
  }
  return result;
}

function cyclicKey(ids) {
  return ids.map((_, i) => [...ids.slice(i), ...ids.slice(0, i)].join(',')).sort()[0];
}

// Match vertex correspondence in component-local mm so reordering and pose do not
// affect topology comparison. Cyclic rotations preserve the triangle winding.
export function compareSurface(reference, candidate, tolerance) {
  const exact = new Map();
  const coordinates = [];
  const edges = new Map();
  const canonical = reference.map((triangle) => {
    const ids = triangle.map((v) => {
      demand(v.every(Number.isFinite), 'Nonfinite STL coordinate');
      const key = v.join(',');
      if (!exact.has(key)) {
        exact.set(key, coordinates.length);
        coordinates.push(v);
      }
      return exact.get(key);
    });
    demand(new Set(ids).size === 3, 'Degenerate STL triangle');
    ids.forEach((a, i) => {
      const b = ids[(i + 1) % 3];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const counts = edges.get(key) ?? [0, 0];
      counts[a < b ? 0 : 1]++;
      edges.set(key, counts);
    });
    return cyclicKey(ids);
  }).sort();
  demand(edges.size && [...edges.values()].every(([a, b]) => a === 1 && b === 1),
    'STL oriented edge incidence is not closed manifold');
  let maxError = 0;
  const actual = candidate.map((triangle) => cyclicKey(triangle.map((vertex) => {
    demand(vertex.every(Number.isFinite), 'Nonfinite GLB coordinate');
    let closest = -1;
    let error = Infinity;
    for (const [id, v] of coordinates.entries()) {
      const delta = Math.max(...v.map((value, axis) => Math.abs(value - vertex[axis])));
      if (delta < error) { closest = id; error = delta; }
      if (delta === 0) break;
    }
    demand(error <= tolerance, 'GLB/STL corresponding vertex does not match');
    maxError = Math.max(maxError, error);
    return closest;
  }))).sort();
  demand(actual.length === canonical.length && actual.every((key, i) => key === canonical[i]),
    'Oriented STL/GLB triangles differ');
  return { triangles: actual.length, unique_vertices: coordinates.length,
    manifold_oriented_edges: edges.size, max_correspondence_error_mm: maxError };
}
