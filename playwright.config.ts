import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: [['list'], ['html', { outputFolder: 'test/reports/browser/html', open: 'never' }], ['json', { outputFile: 'test/reports/browser/results.json' }]],
  outputDir: 'test/reports/browser/artifacts',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } }
  ],
  webServer: { command: 'node scripts/browser-server.mjs', url: 'http://127.0.0.1:4173/test/', reuseExistingServer: !process.env.CI, timeout: 10000 }
})
