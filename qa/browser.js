import { expect } from '@playwright/test';

export async function openScene(page, {blender = process.env.OCTO_BLENDER === '1', fallback = false} = {}) {
  const issues = [];
  page.on('pageerror', error => issues.push(error.message));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) issues.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) issues.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  page.on('requestfailed', request => issues.push(request.failure()?.errorText));
  await page.addInitScript(() => {
    window.octoContextLost = false;
    document.addEventListener('webglcontextlost', () => { window.octoContextLost = true; }, true);
  });
  await page.goto(blender ? '/?octo-qa&tentacle=blender' : '/?octo-qa');
  const mode = blender ? (fallback ? 'fallback' : 'blender') : 'procedural';
  await page.waitForFunction(mode => window.__OCTO_DEBUG__?.getTentacleVariant().mode === mode, mode);
  const variant = await page.evaluate(() => window.__OCTO_DEBUG__.getTentacleVariant());
  await page.waitForFunction(() => window.__OCTO_DEBUG__?.getFrame()?.number > 0);
  const graphics = await page.locator('canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2');
    if (!gl) return null;
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return {renderer: gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER)};
  });
  expect(graphics).not.toBeNull();
  return {
    graphics, variant,
    async expectHealthy() {
      expect(await page.evaluate(() => window.octoContextLost)).toBe(false);
      expect(issues).toEqual([]);
    },
  };
}
