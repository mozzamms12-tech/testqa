// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://www.mouthshut.com',
    headless: false, // Set to true if running in CI/CD environments
    viewport: { width: 1366, height: 768 },
    actionTimeout: 15000,
    screenshot: 'on',
    video: 'on-first-retry',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
