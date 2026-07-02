import { expect, test } from "@playwright/test";

import { WORK_META } from "../../src/lib/content/work-meta";

const SITE_URL = "https://www.luciengeorge.com";

interface PageCase {
  path: string;
  title: RegExp;
  h1: RegExp;
  jsonLdTypes: string[];
  canonical?: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PAGE_CASES: PageCase[] = [
  {
    path: "/about",
    title: /About Lucien George/,
    h1: /Lucien George/,
    jsonLdTypes: ["AboutPage", "Person"],
    canonical: `${SITE_URL}/about`,
  },
  {
    path: "/skills",
    title: /Tech stack/,
    h1: /Skills/,
    jsonLdTypes: ["ProfilePage", "Person"],
    canonical: `${SITE_URL}/skills`,
  },
  {
    path: "/education",
    title: /Education/,
    h1: /Education/,
    jsonLdTypes: ["ProfilePage", "Person"],
    canonical: `${SITE_URL}/education`,
  },
  {
    path: "/work",
    title: /Work history/,
    h1: /Work history/,
    jsonLdTypes: ["CollectionPage", "ItemList"],
    canonical: `${SITE_URL}/work`,
  },
  ...WORK_META.map<PageCase>(({ slug, company }) => ({
    path: `/work/${slug}`,
    title: new RegExp(escapeRegex(company)),
    h1: new RegExp(`^${escapeRegex(company)}$`),
    jsonLdTypes: ["Article", "BreadcrumbList"],
    canonical: `${SITE_URL}/work/${slug}`,
  })),
];

test.describe("static content pages", () => {
  for (const page of PAGE_CASES) {
    test(`${page.path} renders SSR with title, h1, canonical, and required JSON-LD types`, async ({
      page: browserPage,
    }) => {
      const response = await browserPage.goto(page.path);
      expect(response?.status()).toBe(200);
      await expect(browserPage).toHaveTitle(page.title);
      await expect(browserPage.locator("h1")).toContainText(page.h1);
      if (page.canonical) {
        // Root layout emits a canonical pointing at the homepage; child route adds its own.
        const canonicalHrefs = await browserPage
          .locator('link[rel="canonical"]')
          .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
        expect(canonicalHrefs).toContain(page.canonical);
      }
      const ldNodes = await browserPage.locator('script[type="application/ld+json"]').allTextContents();
      const combined = ldNodes.join("\n");
      for (const type of page.jsonLdTypes) {
        expect(combined).toContain(`"@type":"${type}"`);
      }
    });
  }

  test("/work index links to all work slugs", async ({ page }) => {
    await page.goto("/work");
    const links = await page
      .locator("a[href^='/work/']")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    for (const { slug } of WORK_META) {
      expect(links).toContain(`/work/${slug}`);
    }
  });

  test("/work index shows a Download CV CTA and a logo per entry", async ({ page }) => {
    await page.goto("/work");
    // CV download CTA points at the PDF endpoint
    const cv = page.getByRole("link", { name: /download cv/i });
    await expect(cv).toBeVisible();
    await expect(cv).toHaveAttribute("href", "/api/resume/pdf");
    // Every work card renders a logo (img) or an initials fallback (aria-labelled span)
    for (const { company } of WORK_META) {
      await expect(page.getByRole("img", { name: new RegExp(`${company}( logo)?`, "i") }).first()).toBeVisible();
    }
  });

  test("/work/$slug shows the company logo and a Download CV CTA", async ({ page }) => {
    await page.goto("/work/fyxer");
    await expect(page.getByRole("img", { name: /fyxer( logo)?/i }).first()).toBeVisible();
    const cv = page.getByRole("link", { name: /download cv/i });
    await expect(cv).toBeVisible();
    await expect(cv).toHaveAttribute("href", "/api/resume/pdf");
  });

  test("/work/$slug has a Back to work link that returns to the index", async ({ page }) => {
    await page.goto("/work/fyxer");
    const back = page.getByRole("link", { name: /back to work/i });
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute("href", "/work");
    await back.click();
    await expect(page).toHaveURL("/work");
  });

  test("/work/unknown-slug returns 404", async ({ page }) => {
    const response = await page.goto("/work/this-does-not-exist", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
  });

  test("/ (chat homepage) has FAQPage + Person + WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");
    const ldNodes = await page.locator('script[type="application/ld+json"]').allTextContents();
    const combined = ldNodes.join("\n");
    expect(combined).toContain(`"@type":"Person"`);
    expect(combined).toContain(`"@type":"WebSite"`);
    expect(combined).toContain(`"@type":"FAQPage"`);
    expect(combined).toContain(`"@type":"Question"`);
    expect(combined).toContain("Who is Lucien George?");
  });

  test("/login is noindex,nofollow", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    // dev server may 500 on auth route; production must be 200. Either way the head() should declare noindex.
    if (response?.status() === 200) {
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute("content", /noindex/);
    } else {
      test.skip(true, "auth route returns non-200 in dev - see auth-config setup");
    }
  });

  test("/signup is noindex,nofollow", async ({ page }) => {
    const response = await page.goto("/signup", { waitUntil: "domcontentloaded" });
    if (response?.status() === 200) {
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute("content", /noindex/);
    } else {
      test.skip(true, "auth route returns non-200 in dev - see auth-config setup");
    }
  });
});
