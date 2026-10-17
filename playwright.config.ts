import { defineConfig, devices } from '@playwright/test'

const PORT = 8123
const BASE = `http://127.0.0.1:${PORT}`

// Boots the real server (with a throwaway data dir) and runs the e2e specs
// against it in headless Chromium.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: BASE, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node server.js',
    url: `${BASE}/healthz`,
    reuseExistingServer: false,
    env: { PORT: String(PORT), DATA_DIR: './.e2e-data' },
  },
})
