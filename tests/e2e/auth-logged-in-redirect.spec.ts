import { expect, test } from "@playwright/test";

/**
 * Verifies a logged-in user hitting `/login` or `/signup` is redirected to `/`
 * with a "You are already logged in" info toast.
 *
 * This spec runs in the `chromium-authed` Playwright project, which depends on the
 * `setup` project (auth.setup.ts) and loads its saved session storage state — so
 * the browser context is already authenticated here.
 */

test.describe("logged-in redirect from /_auth", () => {
  test("/login redirects a logged-in user to / with an info toast", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/already logged in/i)).toBeVisible({ timeout: 5_000 });
  });

  test("/signup redirects a logged-in user to / with an info toast", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/already logged in/i)).toBeVisible({ timeout: 5_000 });
  });
});
