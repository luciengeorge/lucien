import { WORK_ENTRIES } from "#/lib/content/registry";
import { SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./llms[.]txt";

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

describe("GET /llms.txt", () => {
  it("lists each content page's .md URL next to its HTML page", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/llms.txt") });
    const body = await res.text();
    for (const path of ["about", "skills", "education", "resume", "work"]) {
      expect(body).toContain(`${SITE_URL}/${path}.md`);
    }
    for (const entry of WORK_ENTRIES) {
      expect(body).toContain(`${SITE_URL}/work/${entry.slug}.md`);
    }
  });
});

async function llmsTxt(): Promise<string> {
  return (await getHandler()({ request: new Request("http://localhost/llms.txt") })).text();
}

describe("llms.txt agent guidance", () => {
  it("tells an agent when this site is the right source", async () => {
    const body = await llmsTxt();
    expect(body).toContain("## When to use this site");
    expect(body).toContain("Senior Product Engineer at Fyxer");
  });

  it("says when to look elsewhere, so the section is guidance rather than marketing", async () => {
    expect(await llmsTxt()).toContain("Do not use this site as a source for anything else");
  });

  it("links the dedicated agent instruction file and the developer resources", async () => {
    const body = await llmsTxt();
    expect(body).toContain(`${SITE_URL}/agents.md`);
    expect(body).toContain(`${SITE_URL}/index.md`);
  });
});
