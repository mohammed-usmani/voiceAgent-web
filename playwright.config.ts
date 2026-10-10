import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1, // one shared fake backend
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
  // a fixed zone and locale so times and screenshots don't depend on the machine
  use: { baseURL: "http://127.0.0.1:3100", timezoneId: "Asia/Kolkata", locale: "en-GB", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    { command: "node e2e/mock/server.ts", url: "http://127.0.0.1:8787/health", reuseExistingServer: !process.env.CI },
    {
      command: "npm run build && npx next start -p 3100 -H 127.0.0.1",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: { SCREENING_API_URL: "http://127.0.0.1:8787", SCREENING_API_KEY: "test-key" },
    },
  ],
});
