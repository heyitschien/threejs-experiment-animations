import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { expectedEditedTriangles, wrongEditedTriangles } from
  '../experiments/invention-lab/hng-001/edit-geometry.mjs';

const fixture = JSON.parse(await readFile(
  new URL('../experiments/invention-lab/hng-001/fixture.json', import.meta.url), 'utf8'));

test('edited reference is derived from the nominal surface and frozen X extent', () => {
  const sourceX = fixture.parts.moving.leaf[1][0];
  const targetX = fixture.edit.x_max_mm;
  const nominal = [
    [[sourceX, -2, 6.5], [sourceX, 2, 6.5], [sourceX, 2, 17.5]],
    [[3.5, -2, 6.5], [sourceX, -2, 6.5], [sourceX, 2, 17.5]],
  ];
  const expected = expectedEditedTriangles(nominal, fixture);
  assert.deepEqual(nominal[0][0], [sourceX, -2, 6.5], 'nominal reference must not be mutated');
  assert.deepEqual(expected[0][0], [targetX, -2, 6.5]);
  assert.deepEqual(expected[1][0], nominal[1][0], 'vertices outside the edited end plane must be preserved');
});

test('wrong edited control deliberately violates the frozen X extent', () => {
  const targetX = fixture.edit.x_max_mm;
  const edited = [[[targetX, -2, 6.5], [targetX, 2, 6.5], [targetX, 2, 17.5]]];
  const wrong = wrongEditedTriangles(edited, fixture);
  assert.notEqual(wrong[0][0][0], targetX);
  assert.deepEqual(edited[0][0], [targetX, -2, 6.5], 'edited candidate must not be mutated');
});

test('edited reference fails closed when the nominal end plane is absent', () => {
  assert.throws(() => expectedEditedTriangles([[[0, 0, 0], [1, 0, 0], [0, 1, 0]]], fixture),
    /no editable X-end vertices/);
});
