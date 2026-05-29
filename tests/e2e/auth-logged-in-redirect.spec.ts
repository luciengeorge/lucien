import { expect, test } from "@playwright/test";

/**
 * Verifies that a logged-in user hitting `/login` or `/signup` is redirected to `/`
 * with a "You are already logged in" info toast.
 *
 * Requires a pre-seeded Better Auth session cookie injected via the
 * `PLAYWRIGHT_AUTH_COOKIE` env var (format: `<name>=<value>`). In CI this should be
 * produced by a one-time auth setup that:
 *   1. Sets AUTH_ALLOWED_EMAILS=<test-email> on the test deployment.
 *   2. Creates a verified BA user via a seed mutation.
 *   3. Calls authClient.signIn.email to obtain the session cookie.
 *   4. Exports the cookie as PLAYWRIGHT_AUTH_COOKIE.
 *
 * Until that pipeline is wired up, this spec is skipped automatically.
 */

const AUTH_COOKIE = process.env.PLAYWRIGHT_AUTH_COOKIE;

test.describe("logged-in redirect from /_auth (requires PLAYWRIGHT_AUTH_COOKIE)", () => {
  test.skip(!AUTH_COOKIE, "PLAYWRIGHT_AUTH_COOKIE not set — see auth seed setup");

  test.use({
    storageState: {
      cookies: AUTH_COOKIE
        ? (() => {
            const [name, ...rest] = AUTH_COOKIE.split("=");
            return [
              {
                name: name ?? "",
                value: rest.join("="),
                domain: "127.0.0.1",
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "Lax" as const,
                expires: -1,
              },
            ];
          })()
        : [],
      origins: [],
    },
  });

  test("/login redirects logged-in user to / with an info toast", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/already logged in/i)).toBeVisible({ timeout: 5_000 });
  });

  test("/signup redirects logged-in user to / with an info toast", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/already logged in/i)).toBeVisible({ timeout: 5_000 });
  });
});
