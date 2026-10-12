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
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    const sent = page.waitForRequest((r) => r.url().includes("/api/chat") && r.method() === "POST");
    await composer.fill("What does he build?");
    await composer.press("Enter");

    // Assert the send itself: an emptied box alone passes even when nothing sent.
    await sent;
    await expect(page.getByText("What does he build?")).toBeVisible({ timeout: 10_000 });

    // Both while the reply is still streaming; it took 5.4s before the change.
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

test.describe("when a message fails to send", () => {
  test("says so, and offers a retry that actually re-sends", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    let attempts = 0;
    await page.route("**/api/chat", (route) => {
      attempts += 1;
      if (attempts === 1) return route.fulfill({ status: 500, body: "boom" });
      return route.continue();
    });

    await composer.fill("What does he build?");
    await composer.press("Enter");

    const failure = page.getByRole("status").filter({ hasText: /didn't go through/i });
    await expect(failure).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /try again/i }).click();
    await expect.poll(() => attempts, { timeout: 10_000 }).toBeGreaterThan(1);
    await expect(failure).toBeHidden({ timeout: 10_000 });
  });
});

test.describe("composer with an empty message", () => {
  /**
   * `InputGroup` washed the whole group out via `has-disabled:opacity-50`,
   * which is `:has(:disabled)` and so matched the send button too. The send
   * button is disabled exactly when the message is empty, so an empty composer
   * dimmed its own border, background and the resume button. Only the send
   * button should look unavailable.
   */
  test("dims the send button only, not the whole composer", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeVisible({ timeout: 10_000 });
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await expect(composer).toHaveValue("");

    const group = page.locator("[data-slot=input-group]");
    // Exact: a starter prompt reads "Can I see Lucien's resume?" and matches otherwise.
    const resume = page.getByRole("button", { exact: true, name: "Resume" });
    const send = page.getByRole("button", { name: "Send" });

    await expect(send).toBeDisabled();
    await expect(resume).toBeEnabled();

    const opacityOf = async (target: typeof group) => target.evaluate((node) => window.getComputedStyle(node).opacity);

    expect(await opacityOf(group), "the composer itself must not be dimmed").toBe("1");
    expect(await opacityOf(resume), "the resume button must not be dimmed").toBe("1");

    // Typing must not be what restores a normal-looking composer.
    await composer.fill("hello");
    await expect(send).toBeEnabled();
    expect(await opacityOf(group)).toBe("1");
  });
});

/** Holds every server function call (the homepage creates its conversation through one) until released. */
async function holdConversationCreation(page: import("@playwright/test").Page) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    await gate;
    await route.continue();
  });
  return release;
}

test.describe("composer before the conversation exists", () => {
  test("is typable on first paint, and keeps the draft once the conversation arrives", async ({ page }) => {
    const release = await holdConversationCreation(page);
    await page.goto("/");
    const composer = page.getByRole("textbox").first();

    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await expect(composer).toBeFocused({ timeout: 5_000 });
    await composer.fill("hello");

    const created = page.waitForResponse((r) => r.url().includes("/_serverFn/"));
    release();
    await created;
    // The old code remounted the chat as the conversation landed; give it the chance to.
    await page.waitForTimeout(500);
    await expect(composer).toHaveValue("hello");
  });

  test("shows a message sent early at once, and sends it when the conversation is ready", async ({ page }) => {
    const release = await holdConversationCreation(page);
    let chatPosts = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/chat") && r.method() === "POST") chatPosts += 1;
    });

    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await composer.fill("What does he build?");
    await composer.press("Enter");

    await expect(page.getByText("What does he build?")).toBeVisible({ timeout: 2_000 });
    await expect(composer).toHaveValue("");
    expect(chatPosts).toBe(0);

    const sent = page.waitForRequest((r) => r.url().includes("/api/chat") && r.method() === "POST");
    release();
    const body = (await sent).postDataJSON();
    expect(body.id).not.toBe("new-conversation");
    expect(body.message.parts[0].text).toBe("What does he build?");
  });
});

test.describe("starter prompts before the conversation exists", () => {
  test("queue like a typed message instead of failing", async ({ page }) => {
    const release = await holdConversationCreation(page);
    await page.goto("/");
    const prompt = page.getByRole("button", { name: "Can I see Lucien's resume?" });
    await expect(prompt).toBeVisible({ timeout: 10_000 });

    await prompt.click();
    const sent = page.waitForRequest((r) => r.url().includes("/api/chat") && r.method() === "POST");
    release();
    const body = (await sent).postDataJSON();
    expect(body.id).not.toBe("new-conversation");
    expect(body.message.parts[0].text).toBe("Can I see Lucien's resume?");
  });
});

test.describe("when the conversation cannot be created", () => {
  test("shows the retry instead of a reply that will never come", async ({ page }) => {
    let fail = () => {};
    const gate = new Promise<void>((resolve) => {
      fail = resolve;
    });
    await page.route("**/_serverFn/**", async (route) => {
      await gate;
      await route.fulfill({ status: 500, body: "boom" });
    });
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await composer.fill("What does he build?");
    await composer.press("Enter");
    await expect(page.getByText("Thinking…")).toBeVisible();

    fail();
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Thinking…")).toBeHidden();
  });
});

test.describe("typing anywhere on the page", () => {
  test("focuses the composer and puts the keystrokes in it", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await composer.evaluate((node) => node.blur());
    await expect(composer).not.toBeFocused();

    await page.keyboard.type("hi");

    await expect(composer).toBeFocused();
    await expect(composer).toHaveValue("hi");
  });

  test("leaves shortcuts and space alone", async ({ page }) => {
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await composer.evaluate((node) => node.blur());

    await page.keyboard.press("ControlOrMeta+c");
    await page.keyboard.press("Space");

    await expect(composer).not.toBeFocused();
    await expect(composer).toHaveValue("");
  });
});

test.describe("stopping a reply", () => {
  /** A reply that never arrives, so the test controls when the stream ends. */
  async function hangChat(page: import("@playwright/test").Page) {
    await page.route("**/api/chat", () => new Promise(() => {}));
  }

  test("swaps Send for Stop while a reply is pending, and Stop ends it", async ({ page }) => {
    const created = page.waitForResponse((r) => r.url().includes("/_serverFn/"));
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await created;
    await hangChat(page);

    await composer.fill("What does he build?");
    await composer.press("Enter");

    const stop = page.getByRole("button", { name: "Stop" });
    await expect(stop).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeHidden();

    await stop.click();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
    await expect(page.getByText("Thinking…")).toBeHidden();
  });

  test("Escape stops it too", async ({ page }) => {
    const created = page.waitForResponse((r) => r.url().includes("/_serverFn/"));
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await created;
    await hangChat(page);

    await composer.fill("What does he build?");
    await composer.press("Enter");
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  });
});

test.describe("with reduced motion", () => {
  test("status text does not shimmer", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await holdConversationCreation(page);
    await page.goto("/");
    const composer = page.getByRole("textbox").first();
    await composer.fill("What does he build?");
    await composer.press("Enter");
    const label = page.getByText("Thinking…");
    await expect(label).toBeVisible({ timeout: 10_000 });

    const position = () => label.evaluate((node) => window.getComputedStyle(node).backgroundPosition);
    const before = await position();
    await page.waitForTimeout(600);
    expect(await position()).toBe(before);
  });
});
