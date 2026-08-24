import { expect, test } from "@playwright/test";

const CASES = [
  { list: "/work", detail: /\/work\/[a-z-]+$/ },
  { list: "/writing", detail: /\/writing\/[a-z-]+$/ },
];

test.describe("view transitions", () => {
  for (const { list, detail } of CASES) {
    test(`${list} navigates into a detail page without view-transition errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await page.goto(list);
      await page.locator("ol li a").first().click();
      await expect(page).toHaveURL(detail);
      await expect(page.locator("h1")).toBeVisible();

      /*
       * Two elements sharing a view-transition-name during one navigation makes
       * the browser abandon the transition and log it, so a silent regression
       * here looks like "the animation just stopped working".
       */
      const transitionErrors = [...consoleErrors, ...pageErrors].filter((text) =>
        /view-transition|view transition/i.test(text),
      );
      expect(transitionErrors, `view transition errors:\n${transitionErrors.join("\n")}`).toEqual([]);
      expect(pageErrors, `page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    });
  }

  /*
   * The content pages scroll an inner element rather than the window, so the
   * router's window-based scroll restoration had nothing to restore: going back
   * from a detail page dumped the reader at the top of the list they had
   * scrolled through. Only /work is exercised because it is the one list with
   * enough entries to scroll at the default viewport.
   */
  test("/work restores the list scroll position when returning from a detail page", async ({ page }) => {
    await page.goto("/work");
    const scroller = page.locator("[data-page-scroll]");
    await expect(scroller).toHaveCount(1);

    const scrollable = await scroller.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrollable, "/work is not tall enough to exercise scroll restoration").toBe(true);

    await scroller.evaluate((el) => {
      el.scrollTop = 400;
    });

    /*
     * Clicking the last item makes Playwright scroll it into view first, which
     * moves the list to the bottom (~1155) and, on a slow enough machine, gets
     * persisted by the coalesced write before the navigation happens. The test
     * then restored 1155 and failed against the 400 it had set, intermittently
     * and for no reason to do with the app.
     *
     * So scroll deliberately, then wait until the app has actually recorded
     * that exact position, and assert against what it recorded. Restoration is
     * still what is under test: the position just is not raced any more.
     */
    const link = page.locator("ol li a").last();
    await link.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-page-scroll]");
      return el !== null && sessionStorage.getItem("page-scroll:/work") === String(el.scrollTop);
    });
    const before = await scroller.evaluate((el) => el.scrollTop);
    expect(before, "the list should have scrolled to bring the last entry into view").toBeGreaterThan(0);

    await link.click();
    await expect(page).toHaveURL(/\/work\/[a-z-]+$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/work$/);

    const restored = await page.locator("[data-page-scroll]").evaluate((el) => el.scrollTop);
    expect(Math.abs(restored - before), `scroll was ${restored}, expected about ${before}`).toBeLessThan(40);
  });

  test("the nav is excluded from the page snapshot so it holds still across navigations", async ({ page }) => {
    await page.goto("/writing");
    const chrome = page.locator('[style*="view-transition-name"]').first();
    await expect(chrome).toHaveCount(1);
    await expect(chrome.locator("nav")).toBeVisible();
  });
});
