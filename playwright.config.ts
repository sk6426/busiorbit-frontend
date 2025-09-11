// playwright.config.ts
import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

// Load env for tests (.env.e2e first)
dotenv.config({ path: process.env.PW_ENV_FILE || ".env.e2e" });

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    testIdAttribute: "data-test-id",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // ✅ Auto-start the frontend before tests
  webServer: [
    {
      // If you use CRA or Next dev server
      command: process.env.E2E_START_CMD || "npm start",
      port: Number(process.env.E2E_PORT || 3000),
      reuseExistingServer: true,
      timeout: 120_000,
      stderr: "pipe",
      stdout: "pipe",
    },
  ],
});
