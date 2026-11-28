import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const demand = (value, message) => { if (!value) throw new Error(message); };
const CLOUDFLARE_MAX_FILE_BYTES = 25 * 1024 * 1024;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.step': 'application/step',
};

async function measureStaticBundle(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        const info = await stat(full);
        files.push({ path: relative(root, full), bytes: info.size });
      }
    }
  }
  await walk(root);
  files.sort((a, b) => b.bytes - a.bytes);
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const largest = files[0] ?? { path: null, bytes: 0 };
  return {
    file_count: files.length,
    total_bytes: totalBytes,
    max_file: largest.path,
    max_file_bytes: largest.bytes,
    cloudflare_25mib_limit_ok: largest.bytes < CLOUDFLARE_MAX_FILE_BYTES,
  };
}

export async function serve(root, mountPrefix = '') {
  const base = resolve(root);
  const prefix = mountPrefix ? '/' + mountPrefix.replace(/^\/+|\/+$/g, '') : '';
  const server = createServer(async (request, response) => {
    let pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (prefix) {
      if (pathname === prefix) return response.writeHead(302, { Location: `${prefix}/` }).end();
      if (!pathname.startsWith(`${prefix}/`)) return response.writeHead(404).end('Not found');
      pathname = pathname.slice(prefix.length);
    }
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
  return { url: `http://127.0.0.1:${server.address().port}${prefix ? `${prefix}/` : ''}`, close: () => server.close() };
}

export async function browserQA(dist, evidence) {
  await mkdir(evidence, { recursive: true });
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
  const cleanCopy = await mkdtemp(join(tmpdir(), 'lw-shade-static-'));
  await cp(resolve(dist), cleanCopy, { recursive: true });
  const previewPackage = await measureStaticBundle(cleanCopy);
  demand(previewPackage.cloudflare_25mib_limit_ok, `Static preview exceeds 25 MiB per-file limit: ${previewPackage.max_file}`);
  const server = await serve(cleanCopy);
  const subpathServer = await serve(cleanCopy, '/lw-shade-001');
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

    // Clean-directory non-root subpath mount check + out-of-range angle negative controls
    const subpathPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const subErrors = [], subHttpErrors = [];
    subpathPage.on('pageerror', (e) => subErrors.push(e.message));
    subpathPage.on('response', (r) => { if (r.status() >= 400) subHttpErrors.push({ url: r.url(), status: r.status() }); });
    await subpathPage.goto(subpathServer.url);
    await subpathPage.locator('#app[data-state="ready"]').waitFor();
    const outOfRange = await subpathPage.evaluate(() => {
      const results = [];
      for (const bad of [-1, 61, 90]) {
        let threw = false;
        try { window.__LW_SHADE__.setAngle(bad); } catch (e) { threw = /Angle outside 0–60°/.test(e.message); }
        results.push({ angle: bad, rejected: threw, stayedAt: window.__LW_SHADE__.state().angle });
      }
      return results;
    });
    demand(subErrors.length === 0 && subHttpErrors.length === 0, `Subpath preview errors: ${JSON.stringify({ subErrors, subHttpErrors })}`);
    demand(outOfRange.every((r) => r.rejected && r.stayedAt === 25), `Out-of-range angle control failed: ${JSON.stringify(outOfRange)}`);
    await subpathPage.close();

    // Negative control: missing GLB (HTTP 404)
    const missing = await browser.newPage({ viewport: { width: 900, height: 600 } });
    const responses = [];
    missing.on('response', (response) => { if (response.status() >= 400) responses.push(response.status()); });
    await missing.goto(`${server.url}/?asset=missing.glb`);
    await missing.locator('#app[data-state="error"]').waitFor();
    demand(/Load failed/.test(await missing.locator('#status').textContent()) && responses.includes(404),
      'missing asset was not rejected');
    await missing.close();

    // Negative control: stale/failed geometry.json receipt
    const stale = await browser.newPage({ viewport: { width: 900, height: 600 } });
    await stale.route('**/assets/geometry.json', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'LW-SHADE-001', passed: false }),
    }));
    await stale.goto(server.url);
    await stale.locator('#app[data-state="error"]').waitFor();
    demand(/Stale geometry receipt/.test(await stale.locator('#status').textContent()), 'stale geometry receipt was not rejected');
    await stale.close();

    return { schema: 1, passed: true, chromium: browser.version(), cases,
      preview_package: { ...previewPackage, clean_dir_served: true, subpath_mount_verified: '/lw-shade-001/' },
      negative_controls: [
        { name: 'missing GLB', passed: true, http_status: 404 },
        { name: 'stale geometry receipt', passed: true },
        { name: 'out-of-range angles (-1, 61, 90)', passed: true, angles: outOfRange },
      ],
      mobile_is_emulation: true };
  } finally {
    try { await browser?.close(); } finally {
      server.close();
      subpathServer.close();
      await rm(cleanCopy, { recursive: true, force: true });
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dist, evidence] = process.argv.slice(2);
  browserQA(dist, evidence).then((value) => console.log(JSON.stringify(value, null, 2)), (error) => {
    console.error(error.message); process.exitCode = 1;
  });
}
