import { defineConfig, devices } from '@playwright/test';

// By default Playwright builds and serves the production bundle on port 4173.
// Set E2E_BASE_URL (for example http://127.0.0.1:5173) to test a server you
// already started, such as `npm run dev`.
const PORT = 4173;
const externalUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: externalUrl ?? `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['camera'],
        // Fake camera feed so the live-camera path runs without hardware.
        launchOptions: {
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        },
      },
    },
  ],
  webServer: externalUrl
    ? undefined
    : {
        command: `npm run build && npm run preview -- --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
