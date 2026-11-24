import { test, expect } from '@playwright/test';
import { openScene } from './browser.js';

test('Blender is opt-in and the original still renders when its GLB fails', async ({page, context}) => {
  let requests = 0;
  await context.route('**/blender-tentacle.glb', async route => {
    requests++;
    await route.fulfill({status: 200, body: 'invalid glTF'});
  });
  const original = await openScene(page, {blender: false});
  expect(requests).toBe(0);
  await original.expectHealthy();

  const fallbackPage = await context.newPage();
  const fallback = await openScene(fallbackPage, {blender: true, fallback: true});
  expect(requests).toBe(1);
  expect(fallback.variant.mode).toBe('fallback');
  await fallback.expectHealthy();
});

test('Blender arm deforms at fixed poses and under ordinary playback', async ({page}) => {
  const health = await openScene(page, {blender: true});
  expect(health.variant).toMatchObject({mode: 'blender', arm: 3});
  for (const pose of [0, 3.4, 6.8]) {
    await page.evaluate(pose => window.__OCTO_DEBUG__.freezeAt(pose), pose);
    await page.waitForFunction(pose => window.__OCTO_DEBUG__.getFrame().pose === pose, pose);
    expect(await page.evaluate(() => window.__OCTO_DEBUG__.getTentacleVariant().mode)).toBe('blender');
  }
  await page.getByRole('button', {name: /resume motion/i}).click();
  await page.waitForFunction(() => window.__OCTO_DEBUG__.getFrame().pose > 7);
  await health.expectHealthy();
});
