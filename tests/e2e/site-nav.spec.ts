import { expect, test } from "@playwright/test";

const NAV_LINKS: Array<{ label: string; href: string }> = [
  { href: "/", label: "Chat" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/skills", label: "Skills" },
  { href: "/education", label: "Education" },
  { href: "/resume", label: "CV" },
];

const SOCIAL_LABELS = ["GitHub", "LinkedIn", "X", "Instagram"];

/*
 * The Field Notes redesign replaced the floating glass nav pill with a ruled
 * journal masthead. Two deliberate consequences are encoded below:
 *
 * - There is no mobile dropdown. Six items fit in a scrollable row, so the
 *   menu button and its Base UI popup are gone rather than restyled. Mobile
 *   coverage now asserts the links are directly reachable instead.
 * - Social links moved out of the nav and into the footer colophon, so they
 *   are asserted against `contentinfo`.
 */

test.describe("JournalNav (desktop)", () => {
  test.use({ viewport: { height: 820, width: 1280 } });

  test("the masthead wordmark links home", async ({ page }) => {
    await page.goto("/about");
    const masthead = page.getByRole("link", { name: "Lucien George | Home" }).first();
    await expect(masthead).toBeVisible();
    await expect(masthead).toHaveAttribute("href", "/");
  });

  test("exposes all nav links pointing at the correct routes", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    for (const { href, label } of NAV_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
  });

  test("active link gets the active variant on each page", async ({ page }) => {
    for (const { href, label } of NAV_LINKS) {
      await page.goto(href);
      const link = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label, exact: true });
      // TanStack Router's `activeProps` injects `data-status="active"` on the matching link.
      await expect(link).toHaveAttribute("data-status", "active");
    }
  });

  test("clicking a nav link navigates without a full reload", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "Work", exact: true }).click();
    await expect(page).toHaveURL("/work");
    await nav.getByRole("link", { name: "Skills", exact: true }).click();
    await expect(page).toHaveURL("/skills");
  });
});

test.describe("Journal colophon", () => {
  test.use({ viewport: { height: 820, width: 1280 } });

  test("exposes all social links opening in a new tab", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    for (const label of SOCIAL_LABELS) {
      const link = footer.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noreferrer/);
    }
  });

  test("carries the specimen line on every page", async ({ page }) => {
    for (const href of ["/", "/about", "/work"]) {
      await page.goto(href);
      await expect(page.getByRole("contentinfo").getByText(/SPECIMEN: builder/)).toBeVisible();
    }
  });
});

test.describe("JournalNav (mobile)", () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test("keeps every nav link directly reachable without a menu", async ({ page }) => {
    await page.goto("/about");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();

    for (const { href, label } of NAV_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      // The row scrolls horizontally, so a link may start out of view.
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
    }
  });

  test("navigating from the mobile nav works", async ({ page }) => {
    await page.goto("/about");
    const link = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Work", exact: true });
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL("/work");
  });
});
