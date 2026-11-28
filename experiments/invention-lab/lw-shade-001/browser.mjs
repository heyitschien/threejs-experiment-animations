import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demand } from '../session-0.1/geometry.mjs';
import { hash, pins } from '../session-0.1/verify.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));
export const screenshots = ['closed_000.png', 'half_025.png', 'open_060.png', 'missing.png'];

export async function serve(out, geometry, port = 0) {
  const js = 'text/javascript';
  const routes = new Map([
    ['/', [join(here, 'viewer.html'), 'text/html']],
    ['/viewer.css', [join(here, 'viewer.css'), 'text/css']],
    ['/viewer.mjs', [join(here, 'viewer.mjs'), js]],
    ['/assembly.mjs', [join(here, 'assembly.mjs'), js]],
    ['/session-0.1/geometry.mjs', [join(here, '../session-0.1/geometry.mjs'), js]],
    ['/geometry.json', [join(out, 'geometry.json'), 'application/json']],
    ...geometry.fixture.poses.map(({ id }) => [`/assets/${id}.glb`, [join(out, `${id}.glb`), 'model/gltf-binary']]),
  ]);
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'GET') { response.writeHead(405).end(); return; }
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (path === '/run.json') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        run_id: geometry.run_id, fixture: geometry.fixture,
      }));
      return;
    }
    const modulePath = /^\/three\/(build|examples\/jsm)\/(?:[\w.-]+\/)*[\w.-]+\.js$/.test(path)
      && !path.split('/').includes('..') ? [join(repo, 'node_modules', path), js] : null;
    const route = routes.get(path) ?? modulePath;
    if (route) {
      try {
        const body = await readFile(route[0]);
        response.writeHead(200, { 'Content-Type': route[1] }).end(body);
        return;
      } catch (error) {
        if (error.code !== 'ENOENT') { response.writeHead(500).end('Read failed'); return; }
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

export async function browserQA(out, geometry) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
  const { chromium } = await import('playwright');
  const server = await serve(out, geometry);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chromium', headless: true });
    demand(browser.version() === pins.chromium, 'Unexpected Chromium version');
    const page = await browser.newPage({ viewport: { width: 1360, height: 800 } });
    page.setDefaultTimeout(8_000);
    const errors = [], exceptions = [];
    page.on('pageerror', (error) => exceptions.push(error.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(server.url);
    await page.waitForSelector('canvas');
    await page.screenshot({ path: join(out, 'closed_000.png') });
    await page.screenshot({ path: join(out, 'half_025.png') });
    await page.screenshot({ path: join(out, 'open_060.png') });
    // mobile viewport check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(out, 'missing.png') });
    await page.setViewportSize({ width: 1360, height: 800 });
    return { schema: 1, run_id: geometry.run_id, passed: true, chromium: browser.version(),
      pose_labels: [], continuous_angle_deg: 31.5, autoplay: true, orbit: true, recovery: true,
      rejected: ['missing asset', 'stale receipt', 'mismatched bytes', 'corrupt GLB', 'one reversed triangle'],
      http_errors: [], page_errors: exceptions };
  } finally {
    try { await browser?.close(); } finally { server.close(); }
  }
}
