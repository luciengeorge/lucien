import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./index[.]md";

type SimpleGetHandler = (ctx: { request: Request }) => Promise<Response> | Response;

function isGetHandler(value: unknown): value is SimpleGetHandler {
  return typeof value === "function";
}

function getHandler(): SimpleGetHandler {
  const handlers = Route.options.server?.handlers;
  if (typeof handlers !== "object" || handlers === null) {
    throw new Error("Route.options.server.handlers is not an object");
  }
  const get = handlers.GET;
  if (!isGetHandler(get)) {
    throw new Error("Route.options.server.handlers.GET is not a function");
  }
  return get;
}

async function body(): Promise<string> {
  const res = await getHandler()({ request: new Request("http://localhost/index.md") });
  return res.text();
}

describe("GET /index.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/index.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries frontmatter pointing at the canonical site root", async () => {
    const markdown = await body();
    expect(markdown.startsWith("---\n")).toBe(true);
    expect(markdown).toContain(`url: ${SITE_URL}/`);
  });

  it("leads with a single top-level heading", async () => {
    const markdown = await body();
    expect(markdown.match(/^# .+$/gm)).toHaveLength(1);
  });

  it("tells an agent when to use this site and how to read it", async () => {
    const markdown = await body();
    expect(markdown).toContain("## When to use this site");
    expect(markdown.toLowerCase()).toContain("accept: text/markdown");
  });

  it("maps every page an agent can read, with its markdown twin", async () => {
    const markdown = await body();
    for (const path of ["/about", "/work", "/writing", "/skills", "/education", "/resume"]) {
      expect(markdown).toContain(`${SITE_URL}${path})`);
      expect(markdown).toContain(`${SITE_URL}${path}.md`);
    }
    for (const entry of WORK_META) {
      expect(markdown).toContain(`${SITE_URL}/work/${entry.slug}`);
    }
    for (const entry of WRITING_META) {
      expect(markdown).toContain(`${SITE_URL}/writing/${entry.slug}`);
    }
  });

  it("points at the machine-readable index files", async () => {
    const markdown = await body();
    for (const path of ["/llms.txt", "/llms-full.txt", "/sitemap.xml", "/robots.txt"]) {
      expect(markdown).toContain(`${SITE_URL}${path}`);
    }
  });

  it("gives an agent enough prose to answer basic questions without another fetch", async () => {
    const markdown = await body();
    expect(markdown.length).toBeGreaterThan(1500);
    expect(markdown).toContain("Fyxer");
    expect(markdown).toContain("London");
  });
});
