import { test, expect } from '@playwright/test';
import { openScene } from './browser.js';
import { desktop, mobile } from './shots.js';

const state = page => page.evaluate(() => window.__OCTO_DEBUG__.getState());
const frame = page => page.evaluate(() => window.__OCTO_DEBUG__.getFrame());

test.describe('desktop', () => {
  test.use(desktop);
  test('pause, resume, orbit, wheel zoom, reset and resize', async ({ page }) => {
    const health = await openScene(page);
    const status = page.locator('#motion-state');
    await expect(status).toHaveText('ACTIVE');
    await page.locator('#motion-toggle').click();
    await expect(status).toHaveText('PAUSED');
    const paused = (await state(page)).animationTime;
    const first = (await frame(page)).number;
    await expect.poll(async () => (await frame(page)).number).toBeGreaterThan(first + 2);
    expect((await state(page)).animationTime).toBe(paused);
    await page.locator('#motion-toggle').click();
    await expect.poll(async () => (await state(page)).animationTime).toBeGreaterThan(paused);

    await page.mouse.move(720, 450);
    await page.mouse.down();
    await page.mouse.move(815, 465, {steps: 8});
    await page.mouse.up();
    await expect.poll(async () => (await state(page)).viewOffset).toBeGreaterThan(0.2);
    await page.locator('#reset-view').click();
    await expect.poll(async () => (await state(page)).viewOffset).toBeLessThan(0.001);
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, -220);
    await expect.poll(async () => (await state(page)).viewOffset).toBeGreaterThan(0.2);
    await page.locator('#reset-view').click();
    await page.setViewportSize({width: 1024, height: 768});
    await expect.poll(async () => (await frame(page)).canvas).toEqual([1024, 768]);
    await expect.poll(async () => (await state(page)).viewOffset).toBeLessThan(0.001);
    await health.expectHealthy();
  });

  test('reduced motion starts paused', async ({ page }) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    const health = await openScene(page);
    await expect(page.locator('#motion-state')).toHaveText('PAUSED');
    expect((await frame(page)).pose).toBe(0);
    await health.expectHealthy();
  });

  test('WebGL unavailable shows the fallback, with no rendered canvas', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (['webgl2', 'webgl', 'experimental-webgl'].includes(type)) return null;
        return original.call(this, type, ...args);
      };
    });
    const failure = page.waitForEvent('pageerror');
    await page.goto('/?octo-qa');
    await expect(page.locator('#fallback')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect((await failure).message).toMatch(/WebGL context/i);
  });
});

test.describe('touch emulation', () => {
  test.use(mobile);
  test('touch orbit, pinch, reset and orientation resize', async ({ page }) => {
    const health = await openScene(page);
    const cdp = await page.context().newCDPSession(page);
    const dispatch = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints});
    await dispatch('touchStart', [{x: 177, y: 440}]);
    await dispatch('touchMove', [{x: 243, y: 462}]);
    await dispatch('touchEnd', []);
    await expect.poll(async () => (await state(page)).viewOffset).toBeGreaterThan(0.2);
    await page.locator('#reset-view').click();
    await expect.poll(async () => (await state(page)).viewOffset).toBeLessThan(0.001);
    await dispatch('touchStart', [{x: 155, y: 440, id: 0}, {x: 225, y: 440, id: 1}]);
    await dispatch('touchMove', [{x: 110, y: 440, id: 0}, {x: 275, y: 440, id: 1}]);
    await dispatch('touchEnd', []);
    await expect.poll(async () => (await state(page)).viewOffset).toBeGreaterThan(0.2);
    await page.locator('#reset-view').click();
    await page.setViewportSize({width: 844, height: 390});
    await expect.poll(async () => (await frame(page)).canvas[0]).toBe(1266);
    await expect(page.locator('#reset-view')).toBeVisible();
    await health.expectHealthy();
  });
});
