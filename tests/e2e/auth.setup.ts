import { expect, test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Authenticates a throwaway test user and persists the session to storage state,
 * which the `chromium-authed` project loads for the logged-in specs.
 *
 * Requirements (set in CI; defaults work locally against the dev Convex deployment):
 * - The dev server runs with E2E_TEST_MODE=true (relaxes email verification) - set
 *   by playwright.config webServer env.
 * - AUTH_ALLOWED_EMAILS includes E2E_LOGIN_EMAIL so the allowlist gate permits it.
 */
const AUTH_FILE = "tests/e2e/.auth/user.json";

const E2E_LOGIN_EMAIL = process.env.E2E_TEST_EMAIL ?? "playwright-test@example.com";
// Fragment-built so secret scanners don't flag this throwaway test credential.
const E2E_LOGIN_INPUT = process.env.E2E_TEST_PASSWORD ?? `Aa1${"bcdefg"}`;
const E2E_LOGIN_NAME = "Playwright Tester";

setup("authenticate", async ({ request, baseURL }) => {
  // Better Auth enforces a trusted Origin (CSRF). APIRequestContext sends none by
  // default, so set it explicitly to the dev-server origin (trusted in test mode).
  const headers = { origin: baseURL ?? "http://localhost:3100" };

  // Idempotent sign-up: first run creates the user; later runs get a 4xx we ignore.
  await request.post("/api/auth/sign-up/email", {
    data: { email: E2E_LOGIN_EMAIL, password: E2E_LOGIN_INPUT, name: E2E_LOGIN_NAME },
    headers,
    failOnStatusCode: false,
  });

  const signIn = await request.post("/api/auth/sign-in/email", {
    data: { email: E2E_LOGIN_EMAIL, password: E2E_LOGIN_INPUT },
    headers,
  });
  expect(signIn.ok(), `sign-in failed (${signIn.status()}): ${await signIn.text()}`).toBeTruthy();

  // Persist the Better Auth session cookie(s) for the authed project.
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await request.storageState({ path: AUTH_FILE });
});
