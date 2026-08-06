import { loadResume } from "#/lib/resume/load";
import { SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { Route } from "./llms-full[.]txt";

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

describe("GET /llms-full.txt", () => {
  it("includes a Resume section (rendered from content/resume.json) after Work history", async () => {
    const res = await getHandler()({ request: new Request("http://localhost/llms-full.txt") });
    const body = await res.text();
    const resume = loadResume();

    expect(body).toContain(`## Resume (${SITE_URL}/resume)`);
    expect(body).toContain(resume.personal.name);
    expect(body).toContain(resume.experiences[0]?.company ?? "");

    const workIndex = body.indexOf("## Work history");
    const resumeIndex = body.indexOf("## Resume");
    expect(workIndex).toBeGreaterThan(-1);
    expect(resumeIndex).toBeGreaterThan(workIndex);
  });
});
