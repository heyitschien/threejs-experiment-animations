const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const clone = (triangles) => triangles.map((triangle) => triangle.map((vertex) => [...vertex]));

// The frozen edit extends only the rectangular leaf's positive-X end. Derive the
// expected edited mesh from the nominal reference by moving that end plane; do
// not use any coordinate or topology from the edited derivative itself.
export function expectedEditedTriangles(nominal, fixture) {
  const sourceX = fixture.parts.moving.leaf[1][0];
  const targetX = fixture.edit.x_max_mm;
  const slab = fixture.edit.allowed_slab;
  const tolerance = fixture.tolerances.oriented_triangle_coordinate_mm;
  requireValue(Number.isFinite(sourceX) && Number.isFinite(targetX) && targetX > sourceX,
    'Invalid frozen edit extent');
  requireValue(slab[0][0] === sourceX && slab[1][0] === targetX,
    'Frozen edit slab does not match the leaf extension');
  let moved = 0;
  const expected = clone(nominal);
  for (const triangle of expected) {
    for (const vertex of triangle) {
      requireValue(vertex.length === 3 && vertex.every(Number.isFinite), 'Invalid nominal STL coordinate');
      requireValue(vertex[0] <= sourceX + tolerance, 'Nominal STL exceeds its frozen X extent');
      if (Math.abs(vertex[0] - sourceX) <= tolerance) {
        requireValue(vertex.slice(1).every((value, axis) =>
          value >= slab[0][axis + 1] - tolerance && value <= slab[1][axis + 1] + tolerance),
        'Nominal X-end vertex falls outside the frozen edit slab');
        vertex[0] = targetX;
        moved++;
      }
    }
  }
  requireValue(moved > 0, 'Nominal STL has no editable X-end vertices');
  return expected;
}

// Deliberately shorten the edited end plane for the fail-closed control. The
// displacement is well beyond every frozen coordinate tolerance.
export function wrongEditedTriangles(edited, fixture) {
  const targetX = fixture.edit.x_max_mm;
  const tolerance = fixture.tolerances.oriented_triangle_coordinate_mm;
  const wrongX = targetX - Math.max(1, tolerance * 10);
  let changed = 0;
  const wrong = clone(edited);
  for (const triangle of wrong) {
    for (const vertex of triangle) {
      if (Math.abs(vertex[0] - targetX) <= tolerance) {
        vertex[0] = wrongX;
        changed++;
      }
    }
  }
  requireValue(changed > 0, 'Edited STL has no target X-end vertices');
  return wrong;
}
