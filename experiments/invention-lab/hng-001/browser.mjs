import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demand } from '../session-0.1/geometry.mjs';
import { hash, pins } from '../session-0.1/verify.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));
export const screenshots = ['closed_000.png', 'half_045.png', 'open_090.png', 'missing.png'];

export async function serve(out, geometry, port = 0) {
  const js = 'text/javascript';
  const routes = new Map([
    ['/', [join(here, 'viewer.html'), 'text/html']],
    ['/viewer.css', [join(here, 'viewer.css'), 'text/css']],
    ['/hng/viewer.mjs', [join(here, 'viewer.mjs'), js]],
    ['/hng/assembly.mjs', [join(here, 'assembly.mjs'), js]],
    ['/session-0.1/geometry.mjs', [join(here, '../session-0.1/geometry.mjs'), js]],
    ['/geometry.json', [join(out, 'geometry.json'), 'application/json']],
    ...geometry.fixture.poses.map(({ id }) => [`/assets/${id}.glb`, [join(out, `${id}.glb`), 'model/gltf-binary']]),
  ]);
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'GET') {
      response.writeHead(405).end();
      return;
    }
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
        if (error.code !== 'ENOENT') {
          response.writeHead(500).end('Read failed');
          return;
        }
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
    const errors = [], exceptions = [], http = [];
    page.on('pageerror', (error) => exceptions.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push({ url: msg.location().url, text: msg.text() });
    });
    page.on('response', (response) => {
      if (response.status() >= 400) http.push({ url: response.url(), status: response.status() });
    });
    await page.goto(server.url);
    const field = (id) => page.locator('#' + id);
    const wait = (state) => page.locator(`#status[data-state="${state}"]`).waitFor();
    const named = (angle) => page.getByRole('button', { name: angle + '°', exact: true });
    const poseLabels = [];
    const { fixture } = geometry;
    for (const pose of fixture.poses) {
      if (pose.angle_deg !== 0) await named(pose.angle_deg).click();
      await wait('ready');
      const witness = await field('witness').textContent();
      const want = pose.moving_witness.map((v) => v.toFixed(3)).join(', ') + ' mm';
      demand(witness === want && await field('model').getAttribute('data-pose') === pose.id &&
        await field('angle-value').textContent() === pose.angle_deg + '°' &&
        await field('components').textContent() === [fixture.parts.fixed.id, fixture.parts.moving.id].join(' / ') &&
        await field('joint').textContent() === 'hinge.pin_axis · +Z CAD / +Y GLB' &&
        await field('clearance').textContent() === '0.20 / 0.50, 0.50 mm',
      `Incorrect browser labels for ${pose.id}. Witness: ${witness}, expected ${want}`);
      poseLabels.push({ id: pose.id, angle_deg: pose.angle_deg, witness_label: witness });
      await page.screenshot({ path: join(out, pose.id + '.png') });
    }
    const camera = await field('model').getAttribute('data-camera');
    const rect = await field('model').boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2 + 110, rect.y + rect.height / 2 - 30, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction((before) => document.querySelector('canvas').dataset.camera !== before, camera);
    await field('reset').click();
    await field('angle').evaluate((slider) => {
      slider.value = '31.5';
      slider.dispatchEvent(new Event('input'));
    });
    const rad = 31.5 * Math.PI / 180;
    const continuous = [32 * Math.cos(rad) - 2 * Math.sin(rad), 32 * Math.sin(rad) + 2 * Math.cos(rad), 17.5];
    demand(await field('angle-value').textContent() === '31.5°' &&
      await field('witness').textContent() === continuous.map((v) => v.toFixed(3)).join(', ') + ' mm',
    'Continuous motion sample failed');
    await field('play').click();
    await page.waitForFunction(() => {
      const angle = Number(document.querySelector('#angle').value);
      return angle > 3 && angle < 28;
    });
    await field('play').click();
    await named(90).click();
    await wait('ready');
    const lastWitness = await field('witness').textContent();
    const rejected = [];
    async function checkFailure(name, pattern) {
      await wait('error');
      demand(pattern.test(await field('status').textContent()) &&
        await field('model').getAttribute('data-pose') === 'open_090' &&
        await field('witness').textContent() === lastWitness, `Browser accepted ${name} or lost the last pose`);
      rejected.push(name);
    }
    await field('missing').click();
    await checkFailure('missing asset', /\/assets\/missing\.glb returned HTTP 404/);
    await page.screenshot({ path: join(out, 'missing.png') });
    const receiptUrl = server.url + '/geometry.json';
    const stale = { ...geometry, run_id: 'another-run' };
    await page.route(receiptUrl, (route) => route.fulfill({ json: stale }));
    await named(45).click();
    await checkFailure('stale receipt', /Stale or mismatched run receipt/);
    await page.unroute(receiptUrl);
    const glbUrl = server.url + '/assets/half_045.glb';
    const corrupt = Buffer.from('not a glTF asset');
    await page.route(glbUrl, (route) => route.fulfill({ contentType: 'model/gltf-binary', body: corrupt }));
    await named(45).click();
    await checkFailure('mismatched bytes', /GLB hash does not match/);
    const matchingHash = structuredClone(geometry);
    matchingHash.poses.half_045.sha256 = hash(corrupt);
    await page.route(receiptUrl, (route) => route.fulfill({ json: matchingHash }));
    await named(45).click();
    await checkFailure('corrupt GLB with matching receipt hash', /JSON|Unexpected|glTF/i);
    await page.unroute(receiptUrl);
    await page.unroute(glbUrl);
    await named(45).click();
    await wait('ready');
    const intentional = server.url + '/assets/missing.glb';
    demand(await field('model').getAttribute('data-pose') === 'half_045' &&
      http.length === 1 && http[0].url === intentional && http[0].status === 404 &&
      errors.length === 1 && errors[0].url === intentional && errors[0].text.includes('404') &&
      !exceptions.length, `Browser error or recovery mismatch ${JSON.stringify({ http, errors, exceptions })}`);
    return { schema: 1, run_id: geometry.run_id, passed: true, chromium: browser.version(), pose_labels: poseLabels,
      continuous_angle_deg: 31.5, autoplay: true, orbit: true, recovery: true, rejected,
      http_errors: [{ path: '/assets/missing.glb', status: 404 }], page_errors: exceptions };
  } finally {
    try { await browser?.close(); } finally { server.close(); }
  }
}
