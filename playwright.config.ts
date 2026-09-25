import { defineConfig, devices } from '@playwright/test';

const PREVIEW_URL = 'http://localhost:4322';

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: PREVIEW_URL,
  },
  webServer: {
    // `astro preview` only serves an existing dist/, which is absent on a clean
    // checkout — so the build has to run first for `npm run test:e2e` to be
    // self-sufficient.
    command: 'npm run build && npm run preview -- --port 4322',
    url: PREVIEW_URL,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
