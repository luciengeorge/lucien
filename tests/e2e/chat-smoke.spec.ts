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
