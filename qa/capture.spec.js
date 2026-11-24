import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { desktop, mobile, shots } from './shots.js';
import { openScene } from './browser.js';

const candidate = process.env.OCTO_CAPTURE_CANDIDATE === '1';

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
      expect(second.equals(first)).toBe(true);
      const {number, ...frame} = await page.evaluate(() => window.__OCTO_DEBUG__.getFrame());
      const record = {
        commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
        lockSha256: createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),
        browser: browser.version(), graphics: health.graphics, profile: {...profile, viewport: page.viewportSize()}, ...frame,
        pngSha256: createHash('sha256').update(first).digest('hex'),
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
