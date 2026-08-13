import { buildWritingEntryMeta } from "#/lib/content/page-meta";
import { WRITING_ENTRIES } from "#/lib/content/registry";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./{$slug}[.]md";

type SimpleGetHandler = (ctx: { params: { slug: string }; request: Request }) => Promise<Response> | Response;

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

function firstEntry() {
  const entry = WRITING_ENTRIES[0];
  if (!entry) throw new Error("WRITING_ENTRIES is empty");
  return entry;
}

describe("GET /writing/{$slug}.md", () => {
  it("returns 200 with text/markdown content-type for a known slug", async () => {
    const { slug } = firstEntry();
    const res = await getHandler()({
      request: new Request(`http://localhost/writing/${slug}.md`),
      params: { slug },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title/description matching the HTML page's SEO metadata", async () => {
    const entry = firstEntry();
    const meta = buildWritingEntryMeta(entry);
    const res = await getHandler()({
      request: new Request(`http://localhost/writing/${entry.slug}.md`),
      params: { slug: entry.slug },
    });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/writing/${entry.slug}`);
    expect(body).toContain(`title: ${meta.title}`);
  });

  it("exposes the publish date as frontmatter and includes the article body", async () => {
    const entry = firstEntry();
    const res = await getHandler()({
      request: new Request(`http://localhost/writing/${entry.slug}.md`),
      params: { slug: entry.slug },
    });
    const body = await res.text();
    expect(body).toContain(`published: ${entry.published}`);
    const firstLine = entry.source.trim().split("\n")[0];
    if (firstLine) expect(body).toContain(firstLine);
  });

  it("404s for an unknown slug", async () => {
    const res = await getHandler()({
      request: new Request("http://localhost/writing/nope.md"),
      params: { slug: "nope" },
    });
    expect(res.status).toBe(404);
  });
});
