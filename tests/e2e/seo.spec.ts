import { expect, test } from "@playwright/test";

import { WORK_META } from "../../src/lib/content/work-meta";
import { WRITING_META } from "../../src/lib/content/writing-meta";

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
    for (const path of ["/", "/about", "/work", "/work/fyxer", "/writing", "/skills", "/education", "/resume"]) {
      expect(body).toContain(`https://www.luciengeorge.com${path}`);
    }
    for (const entry of WRITING_META) {
      expect(body).toContain(`https://www.luciengeorge.com/writing/${entry.slug}`);
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
    expect(body).toContain("## Resume (https://www.luciengeorge.com/resume)");
  });
});

test.describe("per-page markdown (.md) endpoints", () => {
  // The dev server (nitro's vite plugin) treats extensioned paths as static
  // assets and skips the app for requests without a browser-like Accept
  // header - a dev-only heuristic, verified not to affect the production
  // build (a `vite build` + `vite preview` smoke test returned 200 for these
  // same paths with a plain curl, no Accept header at all). Passing
  // `Accept: text/html` here mirrors what any real navigation sends, so
  // these assertions exercise the actual route handler rather than the dev
  // server's asset short-circuit.
  const HTML_ACCEPT = { Accept: "text/html" };

  test("/about.md and /work/fyxer.md return markdown with frontmatter matching the HTML page's SEO metadata", async ({
    request,
  }) => {
    const aboutRes = await request.get("/about.md", { headers: HTML_ACCEPT });
    expect(aboutRes.status()).toBe(200);
    expect(aboutRes.headers()["content-type"]).toMatch(/text\/markdown/);
    const aboutBody = await aboutRes.text();
    expect(aboutBody).toContain("title: About Lucien George");
    expect(aboutBody).toContain("url: https://www.luciengeorge.com/about");

    const workRes = await request.get("/work/fyxer.md", { headers: HTML_ACCEPT });
    expect(workRes.status()).toBe(200);
    expect(workRes.headers()["content-type"]).toMatch(/text\/markdown/);
    const workBody = await workRes.text();
    expect(workBody).toContain("url: https://www.luciengeorge.com/work/fyxer");
    expect(workBody).toContain("company: Fyxer");
  });

  test("/work/<unknown-slug>.md returns 404", async ({ request }) => {
    const res = await request.get("/work/does-not-exist.md", { headers: HTML_ACCEPT });
    expect(res.status()).toBe(404);
  });

  test("/about.md renders as inline text in a real browser rather than triggering a download", async ({ page }) => {
    let downloadFired = false;
    page.on("download", () => {
      downloadFired = true;
    });
    const response = await page.goto("/about.md");
    expect(response?.status()).toBe(200);
    expect(downloadFired).toBe(false);
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    expect(bodyText).toContain("title: About Lucien George");
  });
});

interface RouteHeadCase {
  path: string;
  title: string;
  description: string;
  ogType: string;
  canonical: string;
  jsonLdType: string;
  image?: string;
  expectedOgImageCount: number;
  /** Sibling `.md` URL this page declares via rel="alternate". */
  markdownUrl: string;
}

test.describe("route <head> metadata", () => {
  const cases: RouteHeadCase[] = [
    {
      path: "/about",
      title: "About Lucien George",
      description:
        "Lucien George is a senior product engineer at Fyxer, based in London and originally from Beirut. He builds products, races karts, and runs ultras.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/about",
      jsonLdType: "AboutPage",
      expectedOgImageCount: 1,
      markdownUrl: "https://www.luciengeorge.com/about.md",
    },
    {
      path: "/skills",
      title: "Lucien George | Tech stack & skills",
      description:
        "Lucien George's tech stack: TypeScript, React, the TanStack ecosystem, Convex, Tailwind, Electron, Ruby on Rails, Python, native iOS/Android.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/skills",
      jsonLdType: "ProfilePage",
      expectedOgImageCount: 1,
      markdownUrl: "https://www.luciengeorge.com/skills.md",
    },
    {
      path: "/education",
      title: "Lucien George | Education",
      description:
        "Lucien George studied software engineering at McGill University, did an exchange at UNSW Sydney, attended Le Wagon London, and completed Harvard Business School's Families in Business program.",
      ogType: "profile",
      canonical: "https://www.luciengeorge.com/education",
      jsonLdType: "ProfilePage",
      expectedOgImageCount: 1,
      markdownUrl: "https://www.luciengeorge.com/education.md",
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
      markdownUrl: "https://www.luciengeorge.com/resume.md",
    },
    {
      path: "/work",
      title: "Lucien George | Work history",
      description:
        "Lucien George's work history: Fyxer, Localista, Skyla, Shopify, Le Wagon, Impact Lebanon, and early roles. Each role with context, scope, and outcomes.",
      ogType: "website",
      canonical: "https://www.luciengeorge.com/work",
      jsonLdType: "CollectionPage",
      expectedOgImageCount: 1,
      markdownUrl: "https://www.luciengeorge.com/work.md",
    },
    {
      path: "/work/fyxer",
      title: "Senior Product Engineer at Fyxer | Lucien George",
      description: "Leads the notetaker desktop app at Fyxer - a background meeting recorder for macOS and Windows.",
      ogType: "article",
      canonical: "https://www.luciengeorge.com/work/fyxer",
      jsonLdType: "Article",
      expectedOgImageCount: 1,
      markdownUrl: "https://www.luciengeorge.com/work/fyxer.md",
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
      await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute("href", c.markdownUrl);

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

  test("every page has exactly one h1 in the served HTML, including the chat homepage", async ({ request }) => {
    const writingPaths = WRITING_META.map((entry) => `/writing/${entry.slug}`);
    for (const path of [
      "/",
      "/about",
      "/work",
      "/work/fyxer",
      "/writing",
      "/skills",
      "/education",
      "/resume",
      ...writingPaths,
    ]) {
      const res = await request.get(path);
      expect(res.status(), `${path} did not return 200`).toBe(200);
      const html = await res.text();
      expect(html.match(/<h1[\s>]/g) ?? [], `${path} should have exactly one h1`).toHaveLength(1);
    }
  });

  test("/resume links to every work entry, so they are reachable from an indexed page", async ({ request }) => {
    const res = await request.get("/resume");
    const html = await res.text();
    for (const entry of WORK_META) {
      expect(html, `/resume should link to /work/${entry.slug}`).toContain(`href="/work/${entry.slug}"`);
    }
  });
});
