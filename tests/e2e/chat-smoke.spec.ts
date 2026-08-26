import { expect, test } from "@playwright/test";

test.describe("chat homepage smoke", () => {
  test("homepage renders without runtime errors and exposes the composer", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page).toHaveTitle(/Lucien George/);
    // Composer textarea or input should be present and editable
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeVisible({ timeout: 10_000 });
    await composer.fill("hi");
    await expect(composer).toHaveValue("hi");

    expect(errors, `pageerrors:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("composer focus on landing", () => {
  test("focuses the input when a visitor lands with a keyboard", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeVisible({ timeout: 10_000 });
    // The composer is disabled on first paint (the conversation is created
    // client-side), so focus has to arrive once it is enabled.
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await expect(composer).toBeFocused({ timeout: 5_000 });
  });
});

test.describe("composer focus on touch", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });

  test("leaves the input alone, so the keyboard does not ambush the page", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeVisible({ timeout: 10_000 });
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    // Give the focus effect the same window it gets on desktop before asserting.
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches)).toBe(true);
    await expect(composer).not.toBeFocused();
  });
});
