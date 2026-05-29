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
    expect(body).toContain("# Lucien George — full content");
    expect(body).toContain("## About (https://www.luciengeorge.com/about)");
    expect(body).toContain("## Work history (https://www.luciengeorge.com/work)");
    expect(body).toContain("### Senior Product Engineer at Fyxer");
  });
});
