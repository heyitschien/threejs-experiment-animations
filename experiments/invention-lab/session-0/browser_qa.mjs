import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.argv[2];
const screenshotDir = path.resolve(process.argv[3]);
await fs.mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleMessages = [];
const pageErrors = [];
page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.goto(`${baseUrl}/viewer/`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pipelineQA?.ready === true);
const initial = await page.evaluate(() => window.__pipelineQA);
await page.screenshot({ path: path.join(screenshotDir, 'browser-calibration-success.png'), fullPage: true });

const canvas = page.locator('#viewer');
const box = await canvas.boundingBox();
if (!box) throw new Error('Viewer canvas has no bounds');
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.42, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(250);
const afterOrbitCamera = await page.evaluate(() => window.__pipelineQA.camera);
const orbitChangedCamera = afterOrbitCamera.some((value, index) => Math.abs(value - initial.camera[index]) > 1e-6);

await page.selectOption('#model-select', 'calibration_box_variant');
await page.waitForFunction(() => window.__pipelineQA?.ready === true && window.__pipelineQA.model === 'calibration_box_variant');
const variant = await page.evaluate(() => window.__pipelineQA);

await page.click('#test-missing');
await page.waitForFunction(() => window.__pipelineQA?.ready === false && window.__pipelineQA.model === 'missing-model');
const missing = await page.evaluate(() => window.__pipelineQA);
await page.screenshot({ path: path.join(screenshotDir, 'browser-missing-file.png'), fullPage: true });

await page.selectOption('#model-select', 'calibration_box');
await page.waitForFunction(() => window.__pipelineQA?.ready === true && window.__pipelineQA.model === 'calibration_box');
const recovered = await page.evaluate(() => window.__pipelineQA);
const consoleErrors = consoleMessages.filter((message) => message.type === 'error');
const unexpectedConsoleErrors = consoleErrors.slice(1);

const report = {
  schema_version: 1,
  browser: await browser.version(),
  initial_model: initial.model,
  initial_ready: initial.ready,
  orbit_pointer_drag_executed: true,
  orbit_changed_camera: orbitChangedCamera,
  camera_before: initial.camera,
  camera_after: afterOrbitCamera,
  variant_model: variant.model,
  variant_ready: variant.ready,
  missing_file_error_visible: missing.ready === false && Boolean(missing.error),
  recovered_model: recovered.model,
  recovered_ready: recovered.ready,
  page_errors: pageErrors,
  console_messages: consoleMessages,
  expected_console_errors: 1,
  unexpected_console_errors: unexpectedConsoleErrors,
  passed: initial.ready && orbitChangedCamera && variant.ready && !missing.ready && recovered.ready && pageErrors.length === 0 && consoleErrors.length === 1,
};
await fs.writeFile(path.join(screenshotDir, 'browser-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (!report.passed) process.exitCode = 1;
