import { WRITING_INDEX_META } from "#/lib/content/page-meta";
import { WRITING_ENTRIES } from "#/lib/content/registry";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./writing[.]md";

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

describe("GET /writing.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/writing.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title in frontmatter, matching the HTML page's SEO metadata", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/writing.md") });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/writing`);
    expect(body).toContain(`title: ${WRITING_INDEX_META.title}`);
  });

  it("lists every article with its own markdown url and publish date", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/writing.md") });
    const body = await res.text();
    for (const entry of WRITING_ENTRIES) {
      expect(body).toContain(`${SITE_URL}/writing/${entry.slug}.md`);
      expect(body).toContain(entry.title);
      expect(body).toContain(entry.published);
    }
  });
});
