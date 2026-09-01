import { CACHE_HEADER } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { withPageCaching } from "./page-caching";

function htmlResponse(init: ResponseInit = {}): Response {
  return new Response("<!DOCTYPE html><html></html>", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    ...init,
  });
}

function get(path = "https://www.luciengeorge.com/about"): Request {
  return new Request(path);
}

describe("withPageCaching", () => {
  it("puts rendered pages behind the CDN", () => {
    const cached = withPageCaching(get(), htmlResponse());

    expect(cached.headers.get("Cache-Control")).toBe(CACHE_HEADER);
  });

  it("overrides the platform default, which is what leaves pages uncached", () => {
    const response = htmlResponse();
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");

    expect(withPageCaching(get(), response).headers.get("Cache-Control")).toBe(CACHE_HEADER);
  });

  it("never caches a response carrying a cookie, so no session can be shared", () => {
    const response = htmlResponse();
    response.headers.set("Set-Cookie", "session=secret; Path=/; HttpOnly");

    expect(withPageCaching(get(), response).headers.get("Cache-Control")).toBeNull();
  });

  it("leaves the markdown twins alone, since they set their own header", () => {
    const markdown = new Response("# Title", { headers: { "Content-Type": "text/markdown; charset=utf-8" } });

    expect(withPageCaching(get(), markdown).headers.get("Cache-Control")).toBeNull();
  });

  it("does not cache a failed render", () => {
    for (const status of [404, 500]) {
      expect(withPageCaching(get(), htmlResponse({ status })).headers.get("Cache-Control")).toBeNull();
    }
  });

  it("only applies to reads", () => {
    const post = new Request("https://www.luciengeorge.com/about", { method: "POST" });

    expect(withPageCaching(post, htmlResponse()).headers.get("Cache-Control")).toBeNull();
  });

  it("preserves the body, status and the other headers", async () => {
    const response = htmlResponse();
    response.headers.set("Vary", "Accept, Accept-Encoding");
    const cached = withPageCaching(get(), response);

    expect(cached.status).toBe(200);
    expect(cached.headers.get("Vary")).toBe("Accept, Accept-Encoding");
    expect(await cached.text()).toContain("<!DOCTYPE html>");
  });
});
