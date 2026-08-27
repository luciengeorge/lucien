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

test.describe("composer after sending", () => {
  test("clears and refocuses immediately, and actually sends", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    // The composer is disabled until the conversation exists, so this also
    // waits for the app to be genuinely ready to send.
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    const sent = page.waitForRequest((r) => r.url().includes("/api/chat") && r.method() === "POST");
    await composer.fill("What does he build?");
    await composer.press("Enter");

    // The send must really happen. An earlier version of this test only
    // checked that the box emptied, which passed even when nothing was sent.
    await sent;
    await expect(page.getByText("What does he build?")).toBeVisible({ timeout: 10_000 });

    // Both of these while the reply is still streaming. Measured at 5.4s
    // before the change, during which the text sat in a blurred input.
    await expect(composer).toHaveValue("", { timeout: 2_000 });
    await expect(composer).toBeFocused({ timeout: 2_000 });
  });

  test("stays typable while the reply streams, so the next question can be written", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    const sent = page.waitForRequest((r) => r.url().includes("/api/chat") && r.method() === "POST");
    await composer.fill("What does he build?");
    await composer.press("Enter");
    await sent;

    await expect(composer).toHaveValue("", { timeout: 2_000 });
    await composer.fill("And where?");
    await expect(composer).toHaveValue("And where?");
  });
});
