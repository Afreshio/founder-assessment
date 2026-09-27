import { defineConfig } from '@playwright/test';

const port = 4174;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: `PORT=${port} node scripts/serve.mjs`,
    url: `http://localhost:${port}/full-power/`,
    reuseExistingServer: true,
  },
});
