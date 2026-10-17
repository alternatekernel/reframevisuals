import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 4317);

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // Phones run only the specs tagged @mobile to keep the matrix fast.
    { name: 'pixel-7', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Vite forwards browser console output here; tests assert on it directly instead.
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
