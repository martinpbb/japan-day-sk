import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/community', fullyParallel: true, workers: 2,
  outputDir: './test-results/community',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/community', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4176', screenshot: 'only-on-failure' },
  globalSetup: './tests/community/server.setup.mjs',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
