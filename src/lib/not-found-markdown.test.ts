import { buildNotFoundMarkdown, notFoundMarkdownResponse } from "#/lib/not-found-markdown";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

describe("buildNotFoundMarkdown", () => {
  it("names the path that was not found", () => {
    expect(buildNotFoundMarkdown("/does-not-exist")).toContain("/does-not-exist");
  });

  it("leads with a single 404 heading", () => {
    const markdown = buildNotFoundMarkdown("/nope");
    expect(markdown.match(/^# .+$/gm)).toHaveLength(1);
    expect(markdown).toMatch(/^# 404/m);
  });

  it("points at the pages an agent should try next", () => {
    const markdown = buildNotFoundMarkdown("/nope");
    for (const path of ["/", "/about", "/work", "/writing", "/skills", "/education", "/resume"]) {
      expect(markdown).toContain(`${SITE_URL}${path}`);
    }
  });

  it("points at the machine-readable index files, so an agent can recover on its own", () => {
    const markdown = buildNotFoundMarkdown("/nope");
    expect(markdown).toContain(`${SITE_URL}/llms.txt`);
    expect(markdown).toContain(`${SITE_URL}/sitemap.xml`);
    expect(markdown).toContain(`${SITE_URL}/index.md`);
  });

  it("stays short enough to be cheap to read", () => {
    expect(buildNotFoundMarkdown("/nope").length).toBeLessThan(2000);
  });

  it("escapes a path that would otherwise break out of the code span", () => {
    const markdown = buildNotFoundMarkdown("/a`b\nc");
    expect(markdown).not.toContain("`b");
    expect(markdown).not.toContain("\nc`");
  });
});

describe("notFoundMarkdownResponse", () => {
  it("is a real 404 served as markdown", async () => {
    const res = notFoundMarkdownResponse("/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
    expect(await res.text()).toMatch(/^# 404/m);
  });

  it("is never cached, so a later real page is not shadowed by its 404", () => {
    expect(notFoundMarkdownResponse("/nope").headers.get("cache-control")).toBe("no-store");
  });
});
