import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ? Number(process.env.PLAYWRIGHT_PORT) : 3100;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const IS_CI = Boolean(process.env.CI);

// Storage state produced by the auth setup project and consumed by logged-in specs.
const AUTH_FILE = "tests/e2e/.auth/user.json";

// Locally we load secrets from .env.local; in CI the job's env block already
// has them, so we run vite directly (there is no .env.local on the runner).
const DEV_COMMAND = IS_CI
  ? `vite dev --port ${PORT}`
  : `pnpm dlx dotenv-cli -e .env.local -- vite dev --port ${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : undefined,
  reporter: IS_CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Signs in a throwaway test user and writes AUTH_FILE.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Logged-out tests (the bulk). Exclude the setup file and the authed specs.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/auth\.setup\.ts/, /auth-logged-in-redirect\.spec\.ts/],
    },
    // Logged-in tests — run only after setup succeeds, using its storage state.
    {
      name: "chromium-authed",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
      testMatch: /auth-logged-in-redirect\.spec\.ts/,
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: DEV_COMMAND,
        url: BASE_URL,
        reuseExistingServer: !IS_CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
        // E2E_TEST_MODE relaxes email verification so the seeded user can sign in.
        env: { E2E_TEST_MODE: "true" },
      },
});
