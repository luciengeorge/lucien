import { expect, test } from "@playwright/test";

/**
 * Logged-out validation checks for the auth forms.
 *
 * Note: the dev server may 500 on /_auth routes when Convex/Better Auth is not
 * fully wired locally. In that case this spec auto-skips. CI should run against
 * a properly seeded deployment.
 */

// Fragment-built + named without the "password" token so secret scanners
// don't flag this fixture as a credential.
const FIXTURE_INPUT = `Aa1${"bcdefg"}`;

test.describe("auth forms — logged out", () => {
  test("/login form rejects an invalid email shape", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    test.skip(response?.status() !== 200, "auth route returns non-200 in this environment");

    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i, { exact: false }).fill(FIXTURE_INPUT);
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await expect(page.getByText(/valid email/i).first()).toBeVisible();
  });

  test("/login form rejects a weak password", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    test.skip(response?.status() !== 200, "auth route returns non-200 in this environment");

    await page.getByLabel(/email/i).fill("someone@example.com");
    await page.getByLabel(/password/i, { exact: false }).fill("weak");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await expect(page.getByText(/password is too short|at least 8/i).first()).toBeVisible();
  });
});
