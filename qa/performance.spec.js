import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { desktop, mobile } from './shots.js';
import { openScene } from './browser.js';

const summarize = frames => {
  const sorted = [...frames].sort((a, b) => a - b);
  const percentile = p => +sorted[Math.ceil(sorted.length * p) - 1].toFixed(2);
  return {
    frames: frames.length,
    fps: +(1000 * frames.length / frames.reduce((a, b) => a + b, 0)).toFixed(2),
    p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99),
    above16_7Ms: frames.filter(ms => ms > 16.7).length,
    above33_3Ms: frames.filter(ms => ms > 33.3).length,
  };
};

for (const [lane, profile] of Object.entries({desktop, 'mobile-emulation': mobile})) {
  test.describe(lane, () => {
    test.use(profile);
    test('three foreground frame-timing trials', async ({ page, browser }, info) => {
      const health = await openScene(page);
      await page.bringToFront();
      expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
      const data = await page.evaluate(() => {
        const debug = window.__OCTO_DEBUG__;
        debug.enableFrameMetrics();
        return {
          frame: debug.getFrame(), targets: debug.getRenderTargets(),
          navigationToProbeMs: performance.now(),
          navigation: performance.getEntriesByType('navigation').map(({responseStart, domContentLoadedEventEnd, loadEventEnd}) =>
            ({responseStart, domContentLoadedEventEnd, loadEventEnd}))[0],
        };
      });
      await page.waitForTimeout(5000);
      const trials = [];
      const raw = [];
      for (let trial = 0; trial < 3; trial++) {
        const sample = await page.evaluate(() => new Promise((resolve, reject) => {
          const frames = [];
          const counters = {};
          let first;
          let last;
          function collect(now) {
            if (document.hidden || !window.__OCTO_DEBUG__.getState().running) {
              reject(new Error('Benchmark requires visible, active animation'));
              return;
            }
            first ??= now;
            if (last !== undefined) frames.push(now - last);
            last = now;
            const metrics = window.__OCTO_DEBUG__.getFrameMetrics();
            for (const key of ['calls', 'triangles', 'textures', 'geometries']) {
              counters[key] = Math.max(counters[key] ?? 0, metrics[key]);
            }
            if (now - first >= 15_000) resolve({frames, peak: counters});
            else requestAnimationFrame(collect);
          }
          requestAnimationFrame(collect);
        }));
        raw.push(sample.frames);
        trials.push({...summarize(sample.frames), peak: sample.peak});
      }
      const knownLayout = data.targets.every(t => t.colorFormat === 'RGBA16F'
        && !t.stencil && !t.mipmaps && t.samples === 0);
      const estimatedAttachmentBytes = knownLayout
        ? data.targets.reduce((total, t) => total + t.width * t.height * (t.depth ? 12 : 8), 0)
        : null;
      const report = {
        commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
        lane, profile, variant: health.variant, headed: true, browser: browser.version(), graphics: health.graphics,
        ...data, estimatedAttachmentBytes, trials,
      };
      await writeFile(info.outputPath('performance.json'), JSON.stringify(report, null, 2) + '\n');
      await writeFile(info.outputPath('raw-intervals.json'), JSON.stringify(raw) + '\n');
      console.log(JSON.stringify({lane, graphics: report.graphics, trials, estimatedAttachmentBytes}));
      await health.expectHealthy();
    });
  });
}
