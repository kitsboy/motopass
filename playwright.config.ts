import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = process.env.SMOKE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Never reuse a stale preview from an old BUILD — caused flaky local e2e.
    reuseExistingServer: false,
    timeout: 60_000,
  },
})