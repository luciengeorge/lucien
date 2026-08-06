import { RESUME_META } from "#/lib/content/page-meta";
import { loadResume } from "#/lib/resume/load";
import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./resume[.]md";

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

describe("GET /resume.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/resume.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("carries the canonical url and title matching the HTML page's SEO metadata", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/resume.md") });
    const body = await res.text();
    expect(body).toContain(`url: ${SITE_URL}/resume`);
    expect(body).toContain(`title: ${RESUME_META.title}`);
  });

  it("renders the resume via the resume markdown serializer (personal name and a company all appear)", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/resume.md") });
    const body = await res.text();
    const resume = loadResume();
    expect(body).toContain(resume.personal.name);
    expect(body).toContain(resume.experiences[0]?.company ?? "");
    expect(body).toContain("## Experience");
  });
});
