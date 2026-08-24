import { DEVELOPERS_META } from "#/lib/content/page-meta";
import { DEVELOPERS_SOURCES } from "#/lib/content/registry";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./developers[.]md";

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

describe("GET /developers.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/developers.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title in frontmatter, matching the HTML page's SEO metadata", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/developers.md") });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/developers`);
    expect(body).toContain(`title: ${DEVELOPERS_META.title}`);
    expect(body).toContain(`# ${DEVELOPERS_META.title}`);
  });

  it("includes the page's source content", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/developers.md") });
    const body = await res.text();
    for (const source of DEVELOPERS_SOURCES) {
      const firstLine = source.trim().split("\n")[0];
      if (firstLine) expect(body).toContain(firstLine);
    }
  });

  /*
   * A trust anchor page an audit (or a person) can actually read: 500 chars is
   * the floor below which the page reads as a placeholder.
   */
  it("carries real content, not a stub", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/developers.md") });
    expect((await res.text()).length).toBeGreaterThan(500);
  });
});
