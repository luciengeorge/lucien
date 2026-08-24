import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./agents[.]md";

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
  return (await getHandler()({ request: new Request("http://localhost/agents.md") })).text();
}

describe("GET /agents.md", () => {
  it("returns 200 with text/markdown content-type", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/agents.md") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("names the jobs this site is the right source for", async () => {
    const markdown = await body();
    expect(markdown).toContain("## When to use this site");
    expect(markdown).toContain("Senior Product Engineer at Fyxer");
  });

  it("says when to look elsewhere, so the guidance is not just marketing", async () => {
    expect(await body()).toContain("Do not use this site as a source for anything else");
  });

  it("says how to fetch it and how to cite it", async () => {
    const markdown = await body();
    expect(markdown).toContain("## How to fetch it");
    expect(markdown).toContain("Accept: text/markdown");
    expect(markdown).toContain(`${SITE_URL}/llms-full.txt`);
    expect(markdown).toContain("Cite the canonical page URL");
  });

  it("is honest that there is no API to call", async () => {
    expect(await body()).toContain("no public API");
  });
});
