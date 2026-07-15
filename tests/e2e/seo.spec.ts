import { expect, test } from "@playwright/test";

test.describe("SEO / GEO / AEO routes", () => {
  test("/robots.txt is served as plain text with AI crawler allows and sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain("User-agent: GPTBot");
    expect(body).toContain("User-agent: ClaudeBot");
    expect(body).toContain("User-agent: PerplexityBot");
    expect(body).toContain("User-agent: Google-Extended");
    expect(body).toContain("Sitemap: https://www.luciengeorge.com/sitemap.xml");
  });

  test("/sitemap.xml is served as XML and lists all canonical routes", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/application\/xml/);
    const body = await res.text();
    for (const path of ["/", "/about", "/work", "/work/fyxer", "/skills", "/education", "/resume"]) {
      expect(body).toContain(`https://www.luciengeorge.com${path}`);
    }
  });

  test("/llms.txt summarises the site for AI crawlers", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toMatch(/^# Lucien George/m);
    expect(body).toContain("(https://www.luciengeorge.com/about)");
    expect(body).toContain("(https://www.luciengeorge.com/work/fyxer)");
    expect(body).toContain("(https://www.luciengeorge.com/llms-full.txt)");
  });

  test("/llms-full.txt concatenates raw content sections", async ({ request }) => {
    const res = await request.get("/llms-full.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain("# Lucien George - full content");
    expect(body).toContain("## About (https://www.luciengeorge.com/about)");
    expect(body).toContain("## Work history (https://www.luciengeorge.com/work)");
    expect(body).toContain("### Senior Product Engineer at Fyxer");
  });
});

test.describe("route <head> metadata", () => {
  const cases = [
    {
      path: "/about",
      title: "About Lucien George",
      description:
        "Lucien George is a senior product engineer at Fyxer, based in London and originally from Beirut. He builds products, races karts, and runs ultras.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/about",
      jsonLdType: "AboutPage",
      image: undefined as string | undefined,
      expectedOgImageCount: 1,
    },
    {
      path: "/skills",
      title: "Lucien George | Tech stack & skills",
      description:
        "Lucien George's tech stack: TypeScript, React, the TanStack ecosystem, Convex, Tailwind, Electron, Ruby on Rails, Python, native iOS/Android.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/skills",
      jsonLdType: "ProfilePage",
      image: undefined as string | undefined,
      expectedOgImageCount: 1,
    },
    {
      path: "/education",
      title: "Lucien George | Education",
      description:
        "Lucien George studied software engineering at McGill University, did an exchange at UNSW Sydney, attended Le Wagon London, and completed Harvard Business School's Families in Business program.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/education",
      jsonLdType: "ProfilePage",
      image: undefined as string | undefined,
      expectedOgImageCount: 1,
    },
    {
      path: "/resume",
      title: "Lucien George | Resume",
      description:
        "Resume of Lucien George, Senior Product Engineer at Fyxer. Past: Shopify, Le Wagon, and startups. McGill BEng in Software Engineering.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/resume",
      jsonLdType: "ProfilePage",
      image: "https://www.luciengeorge.com/cover.png",
      // TanStack Router's head merging dedupes meta tags sharing a property
      // key (route overrides root), so only one og:image tag survives even
      // though both __root.tsx and resume.tsx declare og:image.
      expectedOgImageCount: 1,
    },
    {
      path: "/work",
      title: "Lucien George | Work history",
      description:
        "Lucien George's work history: Fyxer, Localista, Skyla, Shopify, Le Wagon, Impact Lebanon, and early roles. Each role with context, scope, and outcomes.",
      ogType: "website",
      canonical: "https://www.luciengeorge.com/work",
      jsonLdType: "CollectionPage",
      image: undefined as string | undefined,
      expectedOgImageCount: 1,
    },
    {
      path: "/work/fyxer",
      title: "Senior Product Engineer at Fyxer | Lucien George",
      description: "Leads the notetaker desktop app at Fyxer - a background meeting recorder for macOS and Windows.",
      ogType: "article",
      canonical: "https://www.luciengeorge.com/work/fyxer",
      jsonLdType: "Article",
      image: undefined as string | undefined,
      expectedOgImageCount: 1,
    },
  ];

  for (const c of cases) {
    test(`${c.path} emits stable head tags`, async ({ page }) => {
      await page.goto(c.path);
      await expect(page).toHaveTitle(c.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", c.description);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", c.title);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", c.description);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", c.canonical);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", c.ogType);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", c.title);
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", c.description);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", c.canonical);

      await expect(page.locator('meta[property="og:image"]')).toHaveCount(c.expectedOgImageCount);
      if (c.image) {
        await expect(page.locator(`meta[property="og:image"][content="${c.image}"]`)).toHaveCount(1);
        await expect(page.locator(`meta[name="twitter:image"][content="${c.image}"]`)).toHaveCount(1);
      }

      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.some((s) => s.includes(`"@type":"${c.jsonLdType}"`))).toBe(true);
    });
  }

  test("/resume and /work/fyxer also emit a BreadcrumbList JSON-LD script", async ({ page }) => {
    for (const path of ["/resume", "/work/fyxer"]) {
      await page.goto(path);
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.some((s) => s.includes('"@type":"BreadcrumbList"'))).toBe(true);
    }
  });
});
