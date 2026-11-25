export function demand(condition, message) {
  if (!condition) throw new Error(message);
}

export function vectorNear(actual, expected, limit, label) {
  demand([actual, expected].every((v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)),
    `${label}: invalid vector`);
  const error = Math.max(...actual.map((value, axis) => Math.abs(value - expected[axis])));
  demand(error <= limit, `${label}: ${error} mm exceeds ${limit} mm`);
  return error;
}

export const toScene = ([x, y, z]) => [x, z, -y];
export const cadBounds = ({ size: [x, y, z] }) => [[-x / 2, -y / 2, 0], [x / 2, y / 2, z]];
export const sceneBounds = ({ size: [x, y, z] }) => [[-x / 2, 0, -y / 2], [x / 2, z, y / 2]];

// Cyclic permutations preserve winding. Sorting the triangles removes file-order dependence.
function triangleKey(triangle) {
  const keys = triangle.map((point) => point.map((value) => Math.round(value * 1000)).join(','));
  return keys.map((_, i) => [...keys.slice(i), ...keys.slice(0, i)].join('/')).sort()[0];
}

export function readStl(buffer) {
  const view = new DataView(buffer);
  demand(view.byteLength >= 84, 'STL header missing');
  const count = view.getUint32(80, true);
  demand(count > 0 && view.byteLength === 84 + count * 50, 'Invalid binary STL length');
  return Array.from({ length: count }, (_, face) => Array.from({ length: 3 }, (_, vertex) =>
    [0, 1, 2].map((axis) => view.getFloat32(96 + face * 50 + vertex * 12 + axis * 4, true))));
}

export function measureTriangles(triangles, expectedBounds, landmark, limit, label) {
  const points = triangles.flat();
  demand(points.length > 0 && points.every((p) => p.length === 3 && p.every(Number.isFinite)),
    `${label}: missing or nonfinite mesh coordinates`);
  const bounds = [
    [0, 1, 2].map((axis) => Math.min(...points.map((p) => p[axis]))),
    [0, 1, 2].map((axis) => Math.max(...points.map((p) => p[axis]))),
  ];
  const corner = points.reduce((nearest, p) => distance(p) < distance(nearest) ? p : nearest);
  function distance(point) {
    return Math.hypot(...point.map((value, axis) => value - landmark[axis]));
  }
  const error = Math.max(
    vectorNear(bounds[0], expectedBounds[0], limit, `${label} min bounds`),
    vectorNear(bounds[1], expectedBounds[1], limit, `${label} max bounds`),
    vectorNear(corner, landmark, limit, `${label} signed landmark`),
  );
  return { bounds_mm: bounds, corner_mm: corner, max_error_mm: error,
    triangles: triangles.length, triangle_keys: triangles.map(triangleKey).sort() };
}

export function measureScene(scene, model, limit) {
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((node) => { if (node.isMesh) meshes.push(node); });
  demand(meshes.length === 1 && meshes[0].name === model.id && meshes[0].parent === scene,
    `${model.id}: expected one named root mesh`);
  const mesh = meshes[0];
  const { index, attributes: { position } } = mesh.geometry;
  demand(position && (index?.count ?? position.count) % 3 === 0, 'Invalid GLB triangles');
  const triangles = [];
  const point = mesh.position.clone();
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    triangles.push([i, i + 1, i + 2].map((n) => point
      .fromBufferAttribute(position, index ? index.getX(n) : n)
      .applyMatrix4(mesh.matrixWorld).multiplyScalar(1000).toArray()));
  }
  const measurement = measureTriangles(triangles, sceneBounds(model), toScene(model.pocket_min),
    limit, model.id);
  return { ...measurement, mesh_name: mesh.name, matrix_world: mesh.matrixWorld.toArray() };
}
