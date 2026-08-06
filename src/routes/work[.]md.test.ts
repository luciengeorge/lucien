import { WORK_INDEX_META } from "#/lib/content/page-meta";
import { WORK_ENTRIES } from "#/lib/content/registry";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./work[.]md";

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

describe("GET /work.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/work.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title matching the HTML page's SEO metadata", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/work.md") });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/work`);
    expect(body).toContain(`title: ${WORK_INDEX_META.title}`);
  });

  it("lists every work entry with company, role, period, and summary, linking to its own .md", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/work.md") });
    const body = await res.text();
    for (const entry of WORK_ENTRIES) {
      expect(body).toContain(entry.company);
      expect(body).toContain(entry.role);
      expect(body).toContain(entry.period);
      expect(body).toContain(entry.summary);
      expect(body).toContain(`${SITE_URL}/work/${entry.slug}.md`);
    }
  });
});
