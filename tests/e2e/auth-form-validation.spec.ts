import { expect, test } from "@playwright/test";

/**
 * Logged-out rendering checks for the auth routes.
 *
 * The detailed email/password validation rules are exhaustively covered by unit
 * tests (src/lib/schemas/auth.test.ts). Here we only assert the routes render the
 * form for an anonymous visitor - a stable check that doesn't depend on client
 * hydration timing (a submit-then-assert flow races the native form submission).
 */

test.describe("auth forms - logged out", () => {
  test("/login renders the login form for an anonymous visitor", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/password/i, { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("/signup renders the signup form for an anonymous visitor", async ({ page }) => {
    const response = await page.goto("/signup", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/password/i, { exact: false }).first()).toBeVisible();
  });
});
