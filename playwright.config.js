import { defineConfig } from '@playwright/test';

const benchmark = process.env.OCTO_BENCHMARK === '1';
const baseURL = 'http://127.0.0.1:5199';

export default defineConfig({
  testDir: './qa',
  testIgnore: benchmark ? [] : ['**/performance.spec.js'],
  workers: 1,
  timeout: 120_000,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/goldens/{arg}{ext}',
  outputDir: benchmark ? 'octo-evidence/performance' : 'octo-evidence/test-results',
  use: {
    baseURL,
    channel: 'chromium',
    headless: !benchmark,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
