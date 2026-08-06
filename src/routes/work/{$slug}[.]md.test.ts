import { buildWorkEntryMeta } from "#/lib/content/page-meta";
import { WORK_ENTRIES } from "#/lib/content/registry";
import { WORK_META } from "#/lib/content/work-meta";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./{$slug}[.]md";

type SimpleGetHandler = (ctx: { request: Request; params: { slug: string } }) => Promise<Response> | Response;

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

describe("GET /work/{$slug}.md", () => {
  it("returns 200 with text/markdown content-type for a known slug", async () => {
    const res = await getHandler()({
      request: new Request("http://localhost/work/fyxer.md"),
      params: { slug: "fyxer" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title/description matching the HTML page's SEO metadata", async () => {
    const entry = WORK_ENTRIES.find((e) => e.slug === "fyxer");
    if (!entry) throw new Error("fyxer entry missing from WORK_ENTRIES");
    const meta = buildWorkEntryMeta(entry);

    const res = await getHandler()({
      request: new Request("http://localhost/work/fyxer.md"),
      params: { slug: "fyxer" },
    });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/work/fyxer`);
    expect(body).toContain(`title: ${meta.title}`);
    expect(body).toContain(`description: ${meta.description}`);
  });

  it("includes company/role/period as extra frontmatter keys and the entry source in the body", async () => {
    const res = await getHandler()({
      request: new Request("http://localhost/work/fyxer.md"),
      params: { slug: "fyxer" },
    });
    const body = await res.text();
    const entry = WORK_ENTRIES.find((e) => e.slug === "fyxer");
    if (!entry) throw new Error("fyxer entry missing from WORK_ENTRIES");
    expect(body).toContain(`company: ${entry.company}`);
    expect(body).toContain(`role: ${entry.role}`);
    expect(body).toContain(`period: ${entry.period}`);
    expect(body).toContain(entry.source.trim().split("\n")[0]);
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await getHandler()({
      request: new Request("http://localhost/work/does-not-exist.md"),
      params: { slug: "does-not-exist" },
    });
    expect(res.status).toBe(404);
  });

  it("every WORK_META slug produces a valid, non-empty markdown response (coverage guard)", async () => {
    for (const meta of WORK_META) {
      const res = await getHandler()({
        request: new Request(`http://localhost/work/${meta.slug}.md`),
        params: { slug: meta.slug },
      });
      expect(res.status, `slug "${meta.slug}" should return 200`).toBe(200);
      expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
      const body = await res.text();
      expect(body.length, `slug "${meta.slug}" markdown body should be non-empty`).toBeGreaterThan(50);
      expect(body).toContain(`url: ${SITE_URL}/work/${meta.slug}`);
    }
  });
});
