import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { desktop, mobile, shots } from './shots.js';
import { openScene } from './browser.js';

const candidate = process.env.OCTO_CAPTURE_CANDIDATE === '1';

async function checkStability(page, first, second) {
  if (second.equals(first)) return {changedPixels: 0, maxDelta: 0};
  if (!candidate) return expect(second.equals(first)).toBe(true);

  // Allow only isolated one-bit compositor noise on candidate stills.
  const result = await page.evaluate(async images => {
    const decode = async encoded => {
      const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], {type:'image/png'}));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    const [a, b] = await Promise.all(images.map(decode));
    if (a.width !== b.width || a.height !== b.height) throw new Error('Capture dimensions changed');
    let changedPixels = 0;
    let maxDelta = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      let delta = 0;
      for (let channel = i; channel < i + 4; channel++) {
        delta = Math.max(delta, Math.abs(a.data[channel] - b.data[channel]));
      }
      if (delta > 0) changedPixels++;
      maxDelta = Math.max(maxDelta, delta);
    }
    return {changedPixels, maxDelta, pixels: a.width * a.height};
  }, [first.toString('base64'), second.toString('base64')]);
  expect(result.maxDelta).toBeLessThanOrEqual(1);
  expect(result.changedPixels / result.pixels).toBeLessThanOrEqual(0.001);
  return result;
}

const extraShots = process.env.OCTO_REVISION_VIEWS === '1' && candidate
  ? [0, 3.4, 6.8].flatMap(pose => [
    {name: `hero-mobile-360-${pose}`, pose, mobile: true, width: 360},
    {name: `hero-mobile-390-${pose}`, pose, mobile: true},
    {name: `hero-desktop-${pose}`, pose},
  ])
  : [];

for (const shot of [...shots, ...extraShots]) {
  test(shot.name, async ({ browser, baseURL }, info) => {
    const profile = shot.mobile ? mobile : desktop;
    const context = await browser.newContext({
      ...profile, baseURL, viewport: {...profile.viewport, width: shot.width ?? profile.viewport.width},
    });
    try {
      const page = await context.newPage();
      const health = await openScene(page);
      const before = await page.evaluate(async ({camera, pose}) => {
        await document.fonts.ready;
        const debug = window.__OCTO_DEBUG__;
        debug.resetView();
        if (camera) debug.setCamera(camera);
        debug.freezeAt(pose);
        return debug.getFrame().number;
      }, shot);
      await page.waitForFunction(({before, pose}) => {
        const frame = window.__OCTO_DEBUG__.getFrame();
        return frame.number >= before + 2 && frame.pose === pose;
      }, {before, pose: shot.pose});
      const style = shot.camera
        ? 'header, main, footer { visibility: hidden !important; }'
        : '#fps { visibility: hidden !important; }';
      const stylePath = info.outputPath('capture.css');
      await writeFile(stylePath, style);
      const options = {scale: 'css', animations: 'disabled', style};
      const first = await page.screenshot(options);
      const second = await page.screenshot(options);
      const stability = await checkStability(page, first, second);
      const {number, ...frame} = await page.evaluate(() => window.__OCTO_DEBUG__.getFrame());
      const record = {
        commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
        lockSha256: createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),
        browser: browser.version(), graphics: health.graphics, profile: {...profile, viewport: page.viewportSize()}, ...frame,
        stability, pngSha256: createHash('sha256').update(first).digest('hex'),
      };
      await writeFile(info.outputPath('capture.json'), JSON.stringify(record, null, 2) + '\n');
      await writeFile(info.outputPath(`${shot.name}.png`), first);
      await health.expectHealthy();
      if (!candidate) {
        await expect(page).toHaveScreenshot(`${shot.name}.png`, {
          scale: 'css', animations: 'disabled', stylePath, maxDiffPixels: 0,
        });
      }
    } finally {
      await context.close();
    }
  });
}
