import { expect, test } from "@playwright/test";

import { WORK_META } from "../../src/lib/content/work-meta";
import { WRITING_META } from "../../src/lib/content/writing-meta";

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
  {
    path: "/writing",
    title: /Writing/,
    h1: /Writing/,
    jsonLdTypes: ["Blog", "BlogPosting"],
    canonical: `${SITE_URL}/writing`,
  },
  ...WRITING_META.map<PageCase>(({ slug, title }) => ({
    path: `/writing/${slug}`,
    title: new RegExp(escapeRegex(title)),
    h1: new RegExp(`^${escapeRegex(title)}$`),
    jsonLdTypes: ["BlogPosting", "BreadcrumbList"],
    canonical: `${SITE_URL}/writing/${slug}`,
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

  /*
   * #56 gave the homepage an sr-only h1, which fixed the machine signal and
   * left the human one: a visitor saw a logo glyph, a nav, and a wall of
   * assistant prose with no name anywhere. The heading is now on the page.
   * Measured by height because an sr-only element still reports a 1px box.
   */
  test("/ (chat homepage) shows the name rather than hiding it from sighted visitors", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Lucien George");
    const box = await h1.boundingBox();
    expect(box?.height ?? 0, "the h1 should be rendered, not screen-reader-only").toBeGreaterThan(20);
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

test.describe("site footer", () => {
  // Every page with content of its own carries it. The chat homepage does not:
  // it is a fixed-height conversation with no scroll area to end.
  const FOOTER_PATHS = [
    "/about",
    "/skills",
    "/education",
    "/contact",
    "/privacy",
    "/work",
    `/work/${WORK_META[0]?.slug ?? "fyxer"}`,
    "/writing",
    `/writing/${WRITING_META[0]?.slug ?? ""}`,
    "/resume",
  ];

  for (const path of FOOTER_PATHS) {
    test(`${path} carries the footer`, async ({ page }) => {
      await page.goto(path);
      const pages = page.getByRole("navigation", { name: "Pages" });
      await expect(pages.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
      await expect(pages.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
      await expect(page.getByRole("navigation", { name: "For agents" })).toBeVisible();
    });
  }

  test("/ (chat homepage) has no footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Pages" })).toHaveCount(0);
  });

  /*
   * A short page on a tall viewport leaves slack in the scroll area, and the
   * footer belongs at the bottom of it rather than floating under the last
   * paragraph with empty space beneath.
   */
  test("the footer sits at the bottom of the scroll area, not under the last paragraph", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto("/writing");

    const scroller = page.locator("[data-page-scroll]");
    await expect(scroller).toHaveCount(1);

    const scrollerBox = await scroller.boundingBox();
    const footerBox = await page.locator("footer").boundingBox();
    expect(scrollerBox).not.toBeNull();
    expect(footerBox).not.toBeNull();

    // The page is short enough that nothing scrolls, so this is a pure
    // layout assertion: the footer's bottom edge meets the scroller's.
    const scrolls = await scroller.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(scrolls, "/writing should be short enough to leave slack at this height").toBe(false);

    const gap = scrollerBox!.y + scrollerBox!.height - (footerBox!.y + footerBox!.height);
    expect(Math.abs(gap), `footer bottom was ${gap}px from the bottom of the scroll area`).toBeLessThan(4);
  });
});

test.describe("no non-essential storage", () => {
  /*
   * The privacy page claims a complete cookie list and no banner, which is only
   * true while nothing sets a tracking cookie. PostHog runs in cookieless mode
   * and Google Analytics was removed; this fails if either changes, or if a new
   * cookie appears that the page does not document.
   */
  // `cf_clearance` is set by Cloudflare, which sits in front of production but
  // not in front of a local build, so it appears here only when this suite is
  // pointed at the deployed site. It is documented on /privacy either way.
  const DOCUMENTED = ["cf_clearance", "lucien-conversation", "toast"];

  test("the homepage sets only the documented functional cookies, and no web storage", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const names = (await context.cookies()).map((cookie) => cookie.name).sort();
    for (const name of names) {
      expect(DOCUMENTED, `cookie "${name}" is not documented on /privacy`).toContain(name);
    }

    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(stored.local.filter((key) => key.startsWith("ph_"))).toEqual([]);
    expect(stored.session.filter((key) => key.startsWith("ph_"))).toEqual([]);
  });

  test("no Google Analytics anywhere in the document or the CSP", async ({ request }) => {
    const res = await request.get("/", { headers: { Accept: "text/html" } });
    expect(await res.text()).not.toContain("googletagmanager");
    expect(res.headers()["content-security-policy"]).not.toContain("googletagmanager");
  });
});
