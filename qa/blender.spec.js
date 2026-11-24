import { test, expect } from '@playwright/test';
import { armPoint } from '../src/tentacleMath.js';
import { openScene } from './browser.js';

async function expectProceduralCopy(page) {
  await expect(page.locator('#asset-description')).toHaveText('No imported 3D assets. Just geometry, light & code.');
  await expect(page.locator('#construction')).toHaveText('100% PROCEDURAL');
  await expect(page.locator('#asset-footnote')).toHaveText('LOCAL RENDER · NO MODEL API · NO EXTERNAL ASSETS');
}

test('Blender is opt-in and the original still renders when its GLB fails', async ({page, context}) => {
  let requests = 0;
  await context.route('**/blender-tentacle.glb', async route => {
    requests++;
    await route.fulfill({status: 200, body: 'invalid glTF'});
  });
  const original = await openScene(page, {blender: false});
  expect(requests).toBe(0);
  await expectProceduralCopy(page);
  await original.expectHealthy();

  const fallbackPage = await context.newPage();
  const fallback = await openScene(fallbackPage, {blender: true, fallback: true});
  expect(requests).toBe(1);
  expect(fallback.variant.mode).toBe('fallback');
  await expectProceduralCopy(fallbackPage);
  await fallback.expectHealthy();
});

test('Blender arm deforms at fixed poses and under ordinary playback', async ({page}, info) => {
  const health = await openScene(page, {blender: true});
  expect(health.variant).toMatchObject({mode: 'blender', arm: 3});
  await expect(page.locator('#asset-description')).toHaveText('Seven procedural arms and one Blender-authored arm.');
  await expect(page.locator('#construction')).toHaveText('7 PROCEDURAL + 1 GLB');
  await expect(page.locator('#asset-footnote')).toHaveText('LOCAL RENDER · ORIGINAL BLENDER GLB · NO MODEL API');

  const poses = [0, 3.4, 6.8];
  const snapshots = [];
  const rootErrors = [];
  for (const pose of poses) {
    await page.evaluate(pose => window.__OCTO_DEBUG__.freezeAt(pose), pose);
    await page.waitForFunction(pose => window.__OCTO_DEBUG__.getFrame().pose === pose, pose);
    const geometry = await page.evaluate(() => window.__OCTO_DEBUG__.getBlenderGeometry());
    expect(geometry.meshes).toHaveLength(5);
    expect(geometry.rootVertices.length).toBeGreaterThanOrEqual(20);
    const socket = armPoint(health.variant.arm, 0, pose);
    const centroid = socket.map((_, axis) =>
      geometry.rootVertices.reduce((sum, vertex) => sum + vertex[axis], 0) / geometry.rootVertices.length);
    const error = Math.hypot(...centroid.map((value, axis) => value - socket[axis]));
    expect(error).toBeLessThan(1e-5);
    rootErrors.push(error);
    for (const {positions, normals} of geometry.meshes) {
      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every(Number.isFinite) && normals.every(Number.isFinite)).toBe(true);
      expect(normals.length).toBe(positions.length);
      let maxNormalError = 0;
      for (let offset = 0; offset < normals.length; offset += 3) {
        const length = Math.hypot(normals[offset], normals[offset + 1], normals[offset + 2]);
        maxNormalError = Math.max(maxNormalError, Math.abs(length - 1));
      }
      expect(maxNormalError).toBeLessThan(.01);
    }
    snapshots.push(geometry.meshes);
  }

  const changes = snapshots.slice(1).map((meshes, index) => {
    const previous = snapshots[index];
    return meshes.map(({positions, normals}, mesh) => ({
      movedCoordinates: positions.filter((value, i) => Math.abs(value - previous[mesh].positions[i]) > 1e-4).length,
      changedNormalCoordinates: normals.filter((value, i) => Math.abs(value - previous[mesh].normals[i]) > 1e-4).length,
    }));
  });
  expect(changes.flat().every(result => result.movedCoordinates > 0 && result.changedNormalCoordinates > 0)).toBe(true);
  await page.getByRole('button', {name: /resume motion/i}).click();
  await page.waitForFunction(() => window.__OCTO_DEBUG__.getFrame().pose > 7);
  await health.expectHealthy();
  await info.attach('deformation', {
    body: JSON.stringify({poses, rootErrors, changes}),
    contentType: 'application/json',
  });
});
