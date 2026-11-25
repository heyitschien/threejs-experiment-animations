import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demand } from './geometry.mjs';
import { pins } from './verify.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));

export async function serve(out, receipt, port = 0) {
  const config = { run_id: receipt.run_id, ids: receipt.models.map((m) => m.id) };
  const routes = new Map([
    ['/', [join(here, 'viewer.html'), 'text/html']],
    ['/viewer.mjs', [join(here, 'viewer.mjs'), 'text/javascript']],
    ['/geometry.mjs', [join(here, 'geometry.mjs'), 'text/javascript']],
    ['/style.css', [join(here, '../session-0/viewer/style.css'), 'text/css']],
    ['/receipt.json', [join(out, 'geometry.json'), 'application/json']],
    ...config.ids.map((id) => [`/assets/${id}.glb`, [join(out, `${id}.glb`), 'model/gltf-binary']]),
  ]);
  const server = createServer(async (request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    response.setHeader('Cache-Control', 'no-store');
    if (path === '/run.json') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(config));
      return;
    }
    const route = routes.get(path) ?? (/^\/three\/(build|examples\/jsm)\/(?:[\w.-]+\/)*[\w.-]+\.js$/.test(path) &&
      !path.split('/').includes('..') ? [join(root, 'node_modules', path), 'text/javascript'] : null);
    try {
      if (route) {
        const content = await readFile(route[0]);
        response.writeHead(200, { 'Content-Type': route[1] }).end(content);
        return;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        response.writeHead(500).end('Read failed');
        return;
      }
    }
    response.writeHead(404).end('Not found');
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

export async function browserQA(out, receipt) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
  const { chromium } = await import('playwright');
  const viewer = await serve(out, receipt);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chromium', headless: true });
    demand(browser.version() === pins.chromium, 'Unexpected Chromium version');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const failures = [];
    const errors = [];
    const exceptions = [];
    page.on('response', (res) => {
      if (res.status() >= 400) failures.push({ url: res.url(), status: res.status() });
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push({ url: msg.location().url, text: msg.text() });
    });
    page.on('pageerror', (error) => exceptions.push(error.message));
    const waitState = (state) => page.locator(`#status[data-state="${state}"]`).waitFor({ timeout: 8000 });
    const field = (id) => page.locator(`#${id}`).textContent();
    const labels = [];
    async function checkLabels(model) {
      await waitState('ready');
      const format = (values) => values.map((n) => n.toFixed(3)).join(' × ') + ' mm';
      const [min, max] = model.measured.bounds_mm;
      const observed = { id: await field('current'), cad: await field('cad'), glb: await field('measured'),
        landmark: await field('corner'), error: await field('error') };
      demand(observed.id === model.id && observed.cad === format(model.size) &&
        observed.glb === format(max.map((v, i) => v - min[i])) &&
        observed.landmark === model.measured.corner_mm.map((v) => v.toFixed(3)).join(', ') + ' mm' &&
        observed.error === model.measured.max_error_mm.toFixed(6) + ' mm', 'Browser dimension, landmark or error label mismatch');
      labels.push(observed);
    }

    await page.goto(viewer.url);
    const [base, variant] = receipt.models;
    await checkLabels(base);
    await page.screenshot({ path: join(out, 'browser-calibration.png') });
    const canvas = page.locator('#viewer');
    const rect = await canvas.boundingBox();
    const camera = await canvas.getAttribute('data-camera');
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2 + 100, rect.y + rect.height / 2 - 30, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction((before) => document.querySelector('canvas').dataset.camera !== before, camera);
    await page.selectOption('#model', variant.id);
    await checkLabels(variant);
    await page.click('#reset');
    await page.screenshot({ path: join(out, 'browser-variant.png') });

    const missingUrl = `${viewer.url}/assets/missing-model.glb`;
    await page.click('#missing');
    await waitState('error');
    demand((await field('status')).includes('/assets/missing-model.glb returned HTTP 404') &&
      await field('current') === variant.id && await field('measured') === labels[1].glb, 'Missing file lost the last good model');
    await page.screenshot({ path: join(out, 'browser-missing.png') });
    const receiptUrl = `${viewer.url}/receipt.json`;
    for (const [altered, message] of [
      [{ ...receipt, run_id: 'stale-run' }, 'Stale or invalid run receipt'],
      [{ ...receipt, models: [base, { ...variant, glb_sha256: '0'.repeat(64) }] }, 'GLB does not match the run receipt'],
      [{ ...receipt, models: [{ ...base, measured: { ...base.measured, bounds_mm: [[0, 0, 0], [1, 1, 1]] } }, variant] }, 'Receipt bounds'],
    ]) {
      const target = message.startsWith('GLB') ? variant.id : base.id;
      await page.route(receiptUrl, (route) => route.fulfill({ json: altered }));
      if (await page.locator('#model').inputValue() === target) await page.locator('#model').dispatchEvent('change');
      else await page.selectOption('#model', target);
      await waitState('error');
      demand((await field('status')).includes(message) && await field('current') === variant.id,
        'Browser accepted a bad receipt or lost the last good model');
      await page.unroute(receiptUrl);
    }
    await page.locator('#model').dispatchEvent('change');
    await checkLabels(base);
    demand(failures.length === 1 && failures[0].url === missingUrl && failures[0].status === 404 &&
      errors.length === 1 && errors[0].url === missingUrl && errors[0].text.includes('404') &&
      exceptions.length === 0, `Unexpected browser errors: ${JSON.stringify({ failures, errors, exceptions })}`);
    return { schema: 1, run_id: receipt.run_id, chromium: browser.version(), passed: true,
      labels, orbit: true, recovery: true, rejected: ['missing GLB', 'stale receipt', 'GLB hash mismatch', 'invalid receipt bounds'],
      http_errors: [{ path: '/assets/missing-model.glb', status: 404 }], page_errors: exceptions };
  } finally {
    try { await browser?.close(); } finally { viewer.close(); }
  }
}
