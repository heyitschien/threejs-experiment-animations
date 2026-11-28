import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const demand = (value, message) => { if (!value) throw new Error(message); };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.png': 'image/png' };

async function serve(root) {
  const base = resolve(root);
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const requested = pathname === '/' ? '/index.html' : pathname;
    const file = resolve(base, '.' + requested);
    if (!file.startsWith(base + '/') || request.method !== 'GET') return response.writeHead(404).end('Not found');
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store' }).end(body);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
    }
  });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

export async function browserQA(dist, evidence) {
  await mkdir(evidence, { recursive: true });
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
  const server = await serve(dist);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chromium', headless: true });
    const cases = [];
    for (const profile of [
      { name: 'desktop', viewport: { width: 1360, height: 820 } },
      { name: 'mobile-emulation', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    ]) {
      const page = await browser.newPage(profile);
      const errors = [], failed = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) => failed.push(request.url()));
      await page.goto(server.url);
      await page.locator('#app[data-state="ready"]').waitFor();
      demand(await page.locator('#app').getAttribute('data-components') === '6', `${profile.name}: component count`);
      await page.locator('#angle').evaluate((input) => {
        input.value = '31.5'; input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      const motion = await page.evaluate(() => window.__LW_SHADE__.state());
      const want = -31.5 * Math.PI / 180;
      demand(Math.abs(motion.lowerRotationX - want) < 1e-9 && Math.abs(motion.upperRotationX - want) < 1e-9,
        `${profile.name}: slats were not synchronized`);
      await page.locator('#explode').click();
      demand((await page.evaluate(() => window.__LW_SHADE__.state())).exploded === true, `${profile.name}: explode failed`);
      await page.locator('#explode').click();
      await page.locator('#play').click();
      await page.waitForTimeout(220);
      demand((await page.evaluate(() => window.__LW_SHADE__.state())).angle !== 31.5, `${profile.name}: autoplay failed`);
      await page.locator('#play').click();
      const before = await page.locator('canvas').getAttribute('data-camera');
      const rect = await page.locator('canvas').boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down(); await page.mouse.move(rect.x + rect.width * .7, rect.y + rect.height * .35, { steps: 8 }); await page.mouse.up();
      await page.waitForFunction((value) => document.querySelector('canvas').dataset.camera !== value, before);
      await page.locator('#reset').click();
      demand((await page.evaluate(() => window.__LW_SHADE__.state())).angle === 25, `${profile.name}: reset failed`);
      await page.screenshot({ path: join(evidence, `${profile.name}.png`), fullPage: true });
      demand(errors.length === 0 && failed.length === 0, `${profile.name}: browser errors ${JSON.stringify({ errors, failed })}`);
      cases.push({ profile: profile.name, passed: true, angle_slider: true, synchronized: true,
        autoplay: true, orbit: true, explode_reassemble: true, reset: true, browser_errors: 0 });
      await page.close();
    }
    const missing = await browser.newPage({ viewport: { width: 900, height: 600 } });
    const responses = [];
    missing.on('response', (response) => { if (response.status() >= 400) responses.push(response.status()); });
    await missing.goto(`${server.url}/?asset=missing.glb`);
    await missing.locator('#app[data-state="error"]').waitFor();
    demand(/Load failed/.test(await missing.locator('#status').textContent()) && responses.includes(404),
      'missing asset was not rejected');
    await missing.close();
    return { schema: 1, passed: true, chromium: browser.version(), cases,
      negative_controls: [{ name: 'missing GLB', passed: true, http_status: 404 }],
      mobile_is_emulation: true };
  } finally {
    try { await browser?.close(); } finally { server.close(); }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dist, evidence] = process.argv.slice(2);
  browserQA(dist, evidence).then((value) => console.log(JSON.stringify(value, null, 2)), (error) => {
    console.error(error.message); process.exitCode = 1;
  });
}
