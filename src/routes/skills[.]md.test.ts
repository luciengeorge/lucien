import { SKILLS_META } from "#/lib/content/page-meta";
import { SKILLS_SOURCES } from "#/lib/content/registry";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./skills[.]md";

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

describe("GET /skills.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/skills.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title matching the HTML page's SEO metadata", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/skills.md") });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/skills`);
    expect(body).toContain(`title: ${SKILLS_META.title}`);
  });

  it("includes the tech-stack source content in the body", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/skills.md") });
    const body = await res.text();
    for (const source of SKILLS_SOURCES) {
      const firstLine = source.trim().split("\n")[0];
      if (firstLine) expect(body).toContain(firstLine);
    }
  });
});
