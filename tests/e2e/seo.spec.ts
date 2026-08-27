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

  test("/robots.txt lets crawlers reach the resume PDF while still blocking the rest of /api/", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    const generic = body.slice(body.indexOf("User-agent: *"), body.indexOf("User-agent: GPTBot"));
    expect(generic).toContain("Allow: /api/resume/pdf");
    expect(generic).toContain("Disallow: /api/");
    // The Allow must precede the Disallow it carves out of, for crawlers that read in order.
    expect(generic.indexOf("Allow: /api/resume/pdf")).toBeLessThan(generic.indexOf("Disallow: /api/"));
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
      description:
        "Founded Fyxer's notetaker desktop app, then moved to the enterprise pod - SCIM, marketplace billing, and Outlook.",
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

test.describe("markdown content negotiation (acceptmarkdown.com)", () => {
  const MARKDOWN_ACCEPT = { Accept: "text/markdown" };
  const BROWSER_ACCEPT = { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" };
  const NEGOTIABLE_PATHS = ["/", "/about", "/work", "/work/fyxer", "/writing", "/skills", "/education", "/resume"];

  for (const path of NEGOTIABLE_PATHS) {
    test(`${path} serves markdown to a client that asks for it, and declares Vary: Accept`, async ({ request }) => {
      const res = await request.get(path, { headers: MARKDOWN_ACCEPT });
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toMatch(/text\/markdown/);
      expect(res.headers()["vary"]).toMatch(/\baccept\b/i);
      expect(await res.text()).toMatch(/^# /m);
    });

    test(`${path} still serves HTML to a browser, and declares Vary: Accept`, async ({ request }) => {
      const res = await request.get(path, { headers: BROWSER_ACCEPT });
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toMatch(/text\/html/);
      expect(res.headers()["vary"]).toMatch(/\baccept\b/i);
    });
  }

  test("/ negotiated as markdown returns the same body as /index.md", async ({ request }) => {
    const negotiated = await (await request.get("/", { headers: MARKDOWN_ACCEPT })).text();
    const direct = await (await request.get("/index.md", { headers: { Accept: "text/html" } })).text();
    expect(negotiated).toBe(direct);
  });

  test("/index.md maps the site for agents", async ({ request }) => {
    const res = await request.get("/index.md", { headers: { Accept: "text/html" } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/markdown/);
    const body = await res.text();
    expect(body).toContain("url: https://www.luciengeorge.com/");
    expect(body).toContain("## When to use this site");
    expect(body).toContain("https://www.luciengeorge.com/llms-full.txt");
  });
});

test.describe("agent-friendly 404s", () => {
  const MISSING_PATH = "/this-path-does-not-exist-9f3a";

  test("a nonexistent path is a real 404 for every kind of client", async ({ request }) => {
    for (const headers of [{ Accept: "text/html" }, { Accept: "text/markdown" }, { Accept: "*/*" }]) {
      const res = await request.get(MISSING_PATH, { headers });
      expect(res.status()).toBe(404);
    }
  });

  test("a client that did not ask for HTML gets a markdown 404 that says where to look next", async ({ request }) => {
    const res = await request.get(MISSING_PATH, { headers: { Accept: "*/*" } });
    expect(res.status()).toBe(404);
    expect(res.headers()["content-type"]).toMatch(/text\/markdown/);
    const body = await res.text();
    expect(body).toMatch(/^# 404/m);
    expect(body).toContain(MISSING_PATH);
    expect(body).toContain("https://www.luciengeorge.com/llms.txt");
    expect(body).toContain("https://www.luciengeorge.com/sitemap.xml");
    expect(body).toContain("https://www.luciengeorge.com/work");
  });

  test("a browser still gets the rendered 404 page, with links out of the dead end", async ({ page }) => {
    const response = await page.goto(MISSING_PATH, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
    expect(response?.headers()["content-type"]).toMatch(/text\/html/);
    const recovery = page.getByRole("navigation", { name: "Where to look next" });
    await expect(recovery.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/work");
    await expect(recovery.getByRole("link", { name: "llms.txt" })).toHaveAttribute("href", "/llms.txt");
  });
});

test.describe("trust anchor pages", () => {
  const TRUST_PAGES = [
    { path: "/about", heading: "Lucien George" },
    { path: "/contact", heading: "Get in touch" },
    { path: "/privacy", heading: "What this site collects" },
  ];

  for (const { path, heading } of TRUST_PAGES) {
    test(`${path} is a real page with substantive content`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toContainText(heading);
      const text = await page.evaluate(() => document.body?.innerText ?? "");
      expect(text.length).toBeGreaterThan(500);
    });

    test(`${path} is listed in the sitemap and llms.txt`, async ({ request }) => {
      const sitemap = await (await request.get("/sitemap.xml")).text();
      expect(sitemap).toContain(`https://www.luciengeorge.com${path}`);
      const llms = await (await request.get("/llms.txt")).text();
      expect(llms).toContain(`https://www.luciengeorge.com${path})`);
    });
  }

  test("/contact and /privacy negotiate markdown like every other page", async ({ request }) => {
    for (const path of ["/contact", "/privacy"]) {
      const res = await request.get(path, { headers: { Accept: "text/markdown" } });
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toMatch(/text\/markdown/);
      expect(res.headers()["vary"]).toMatch(/\baccept\b/i);
      expect((await res.text()).length).toBeGreaterThan(500);
    }
  });

  // The footer sits inside <main>, so it carries no contentinfo role: locate it
  // by the labels on its two navs instead.
  test("content pages carry a footer linking the trust anchors and the agent files", async ({ page }) => {
    await page.goto("/about");
    const pages = page.getByRole("navigation", { name: "Pages" });
    await expect(pages.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    await expect(pages.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    const agents = page.getByRole("navigation", { name: "For agents" });
    await expect(agents.getByRole("link", { name: "llms.txt" })).toHaveAttribute("href", "/llms.txt");
    await expect(agents.getByRole("link", { name: "index.md" })).toHaveAttribute("href", "/index.md");
  });
});

test.describe("Organization structured data", () => {
  test("the homepage publishes an Organization with a contactPoint and a postal address", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graph = blocks.flatMap((block) => {
      const parsed: unknown = JSON.parse(block);
      if (typeof parsed !== "object" || parsed === null || !("@graph" in parsed)) return [];
      const { "@graph": nodes } = parsed;
      return Array.isArray(nodes) ? nodes : [];
    });

    const organizations = graph.filter(
      (node): node is Record<string, unknown> =>
        typeof node === "object" && node !== null && "@type" in node && node["@type"] === "Organization",
    );
    expect(organizations.length).toBeGreaterThan(0);

    const [organization] = organizations;
    expect(organization?.contactPoint).toMatchObject({ "@type": "ContactPoint", email: expect.any(String) });
    expect(organization?.address).toMatchObject({ "@type": "PostalAddress", addressLocality: "London" });
  });
});

test.describe("homepage content without JavaScript", () => {
  test("the raw document carries a heading and substantive text, with no scripting involved", async ({ request }) => {
    const html = await (await request.get("/", { headers: { Accept: "text/html" } })).text();

    // What a main-content extractor sees: it drops header, nav, footer, and
    // aside subtrees, so the homepage's only h1 has to live outside all four.
    const stripped = ["header", "nav", "footer", "aside"].reduce(
      (acc, tag) => acc.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi"), " "),
      html,
    );
    expect(stripped.match(/<h1[\s>]/g)).toHaveLength(1);
    // Not a flat outline: an h1 with nothing under it reads as a heading-less
    // document to an extractor that scores structure.
    expect((stripped.match(/<h2[\s>]/g) ?? []).length).toBeGreaterThanOrEqual(1);

    const text = stripped
      .replace(/<(script|style|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    expect(text.length).toBeGreaterThan(2000);
    for (const fact of ["Lucien George", "Senior Product Engineer", "Fyxer", "London"]) {
      expect(text).toContain(fact);
    }
  });

  test("the static summary names every role and routes on to the markdown surface", async ({ request }) => {
    const html = await (await request.get("/", { headers: { Accept: "text/html" } })).text();
    const summary = /<details[\s\S]*?<\/details>/i.exec(html)?.[0] ?? "";

    for (const entry of WORK_META) {
      expect(summary).toContain(entry.company);
      expect(summary).toContain(entry.period);
    }
    for (const path of ["/index.md", "/llms.txt", "/llms-full.txt", "/agents.md"]) {
      expect(summary).toContain(`href="${path}"`);
    }
    expect(summary).not.toContain("<h1");
  });

  /*
   * Closed by default, so the chat keeps the page, but in the DOM either way:
   * a <noscript> was stripped by the extractor that scores this, and a reader
   * who can run scripts got no static answer to "who is this" at all.
   */
  test("the static summary is closed by default and openable without scripting", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const details = page.locator("details").first();
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(false);
    await expect(details.locator("h2").first()).toBeAttached();
    await details.locator("summary").click();
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(true);
    await expect(details.getByRole("heading", { level: 2, name: "Work history" })).toBeVisible();
  });
});

test.describe("agent instructions and developer resources", () => {
  test("/agents.md tells an agent when to use the site, how to fetch it, and how to cite it", async ({ request }) => {
    const res = await request.get("/agents.md", { headers: { Accept: "text/html" } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/markdown/);
    const body = await res.text();
    expect(body).toContain("## When to use this site");
    expect(body).toContain("Do not use this site as a source for anything else");
    expect(body).toContain("## How to fetch it");
    expect(body).toContain("Cite the canonical page URL");
    expect(body.length).toBeGreaterThan(1500);
  });

  test("/agents.md documents the markdown surface and the source repository", async ({ request }) => {
    const body = await (await request.get("/agents.md", { headers: { Accept: "text/html" } })).text();
    for (const needle of ["text/markdown", "github.com/luciengeorge/lucien", "llms-full.txt"]) {
      expect(body).toContain(needle);
    }
  });

  /*
   * A page at /developers is probed as a developer portal and read as REST API
   * documentation, which switched on nine checks a portfolio cannot pass, two
   * of them scored as essential. The same content lives in /agents.md, which
   * is not a probe target, and neither document names a surface the site does
   * not have.
   */
  test("no page advertises a product surface the site does not have", async ({ request }) => {
    for (const path of ["/developers", "/developers.md"]) {
      expect((await request.get(path, { headers: { Accept: "text/html" } })).status()).toBe(404);
    }
    // /agents.md is the document that describes the surface, so it is the one
    // that must not describe surfaces the site lacks. ("SDK" is not in this
    // list on purpose: it appears in the Shopify work summary, which is real
    // history rather than a claim about this site.)
    const agents = await (await request.get("/agents.md", { headers: { Accept: "text/html" } })).text();
    for (const absent of ["OpenAPI", "MCP", "webhook", "rate limit"]) {
      expect(agents, `agents.md should not mention ${absent}`).not.toContain(absent);
    }
    for (const path of ["/agents.md", "/index.md", "/llms.txt", "/sitemap.xml"]) {
      const body = await (await request.get(path, { headers: { Accept: "text/html" } })).text();
      expect(body, `${path} should not link the removed /developers page`).not.toContain("/developers");
    }
  });

  test("llms.txt carries when-to-use guidance and links the agent instruction file", async ({ request }) => {
    const body = await (await request.get("/llms.txt")).text();
    expect(body).toContain("## When to use this site");
    expect(body).toContain("https://www.luciengeorge.com/agents.md");
  });
});
