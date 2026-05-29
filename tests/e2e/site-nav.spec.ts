import { expect, test } from "@playwright/test";

const NAV_LINKS: Array<{ label: string; href: string }> = [
  { label: "Chat", href: "/" },
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
  { label: "Skills", href: "/skills" },
  { label: "Education", href: "/education" },
  { label: "CV", href: "/resume" },
];

const SOCIAL_LABELS = ["GitHub", "LinkedIn", "X", "Instagram"];

test.describe("SiteNav (desktop)", () => {
  test.use({ viewport: { width: 1280, height: 820 } });

  test("renders the monogram link to home", async ({ page }) => {
    await page.goto("/about");
    const monogramLink = page.getByRole("link", { name: "Lucien George — Home" }).first();
    await expect(monogramLink).toBeVisible();
    await expect(monogramLink).toHaveAttribute("href", "/");
    // SVG monogram is present
    await expect(monogramLink.locator("svg")).toBeVisible();
  });

  test("exposes all nav links pointing at the correct routes", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    for (const { label, href } of NAV_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
  });

  test("exposes all social links opening in a new tab", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of SOCIAL_LABELS) {
      const link = nav.getByRole("link", { name: label });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noreferrer/);
    }
  });

  test("active link gets the active variant class on each page", async ({ page }) => {
    for (const { label, href } of NAV_LINKS) {
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

test.describe("SiteNav (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows the mobile monogram + dropdown trigger; the desktop pill is hidden", async ({ page }) => {
    await page.goto("/about");
    const monogramLink = page.getByRole("link", { name: "Lucien George — Home" }).first();
    await expect(monogramLink).toBeVisible();
    const trigger = page.getByRole("button", { name: /open menu/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-haspopup", /menu|true/);
  });

  test("opening the menu reveals all nav links and socials, closes after a selection navigates", async ({ page }) => {
    await page.goto("/about");
    const trigger = page.getByRole("button", { name: /open menu/i });
    await expect(trigger).toBeVisible();
    // Wait for Base UI to hydrate the trigger (aria-expanded toggled on mount)
    await expect(trigger).toHaveAttribute("aria-expanded", /false|true/);
    await trigger.click();

    const menu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(menu).toBeVisible();

    for (const { label } of NAV_LINKS) {
      await expect(menu.getByRole("menuitem", { name: label, exact: true })).toBeVisible();
    }
    for (const social of SOCIAL_LABELS) {
      await expect(menu.getByRole("menuitem", { name: social, exact: true })).toBeVisible();
    }

    await menu.getByRole("menuitem", { name: "Work", exact: true }).click();
    await expect(page).toHaveURL("/work");
    await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(0);
  });
});
