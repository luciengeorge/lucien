import { withAgentRepresentation } from "#/lib/agent-representation";
import { MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { describe, expect, it, vi } from "vitest";

function html(status = 200) {
  return new Response("<!DOCTYPE html><html><body>page</body></html>", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    status,
  });
}

function markdown() {
  return new Response("# Page\n", { headers: { "Content-Type": MARKDOWN_CONTENT_TYPE }, status: 200 });
}

/**
 * Stands in for the real app: `.md` paths are route handlers that serve
 * markdown, everything else is server-rendered HTML. Rendering refuses any
 * request that does not accept HTML, exactly as TanStack Start's SSR handler
 * does ("Only HTML requests are supported here", HTTP 500).
 */
function routingHandler() {
  return vi.fn((request: Request) => {
    const { pathname } = new URL(request.url);
    if (pathname.endsWith(".md")) return Promise.resolve(markdown());
    const accept = request.headers.get("accept") ?? "";
    if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Only HTML requests are supported here" }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }),
      );
    }
    if (pathname === "/gone") return Promise.resolve(html(404));
    return Promise.resolve(html());
  });
}

function get(path: string, accept?: string, method = "GET") {
  return new Request(`https://www.luciengeorge.com${path}`, {
    headers: accept === undefined ? {} : { Accept: accept },
    method,
  });
}

describe("withAgentRepresentation", () => {
  it("serves the markdown twin from the HTML URL when the client asks for markdown", async () => {
    const handler = routingHandler();
    const res = await withAgentRepresentation(get("/about", "text/markdown"), handler);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
    expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe("/about.md");
  });

  it("serves the site index markdown for the root", async () => {
    const handler = routingHandler();
    await withAgentRepresentation(get("/", "text/markdown"), handler);
    expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe("/index.md");
  });

  it("keeps serving HTML to a browser", async () => {
    const handler = routingHandler();
    const res = await withAgentRepresentation(
      get("/about", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
      handler,
    );

    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe("/about");
  });

  it("declares Accept in Vary on both representations, so a cache cannot mix them up", async () => {
    const handler = routingHandler();
    for (const accept of ["text/markdown", "text/html"]) {
      const res = await withAgentRepresentation(get("/about", accept), handler);
      expect(res.headers.get("vary")).toMatch(/\bAccept\b/i);
    }
  });

  it("keeps Accept-Encoding in Vary alongside Accept", async () => {
    const handler = vi.fn(() => {
      const res = html();
      res.headers.set("Vary", "Accept-Encoding");
      return Promise.resolve(res);
    });
    const vary = (await withAgentRepresentation(get("/about", "text/html"), handler)).headers.get("vary") ?? "";
    expect(vary.toLowerCase()).toContain("accept-encoding");
    expect(vary.toLowerCase().split(/,\s*/)).toContain("accept");
  });

  it("preserves any other Vary value the response already carried", async () => {
    const handler = vi.fn(() => {
      const res = html();
      res.headers.set("Vary", "Cookie");
      return Promise.resolve(res);
    });
    const vary = (await withAgentRepresentation(get("/about", "text/html"), handler)).headers.get("vary") ?? "";
    expect(vary.toLowerCase()).toContain("cookie");
    expect(vary.toLowerCase()).toContain("accept");
  });

  it("passes through paths with no markdown twin untouched", async () => {
    const handler = routingHandler();
    const res = await withAgentRepresentation(get("/login", "text/markdown"), handler);

    expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe("/login");
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("does not negotiate on writes, only on reads", async () => {
    const handler = routingHandler();
    await withAgentRepresentation(get("/about", "text/markdown", "POST"), handler);
    expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe("/about");
  });

  it("negotiates on HEAD as well as GET", async () => {
    const handler = routingHandler();
    await withAgentRepresentation(get("/about", "text/markdown", "HEAD"), handler);
    expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe("/about.md");
  });

  it("keeps the query string when it rewrites to the markdown twin", async () => {
    const handler = routingHandler();
    await withAgentRepresentation(get("/work/fyxer?ref=agent", "text/markdown"), handler);
    const rewritten = new URL(handler.mock.calls[0]![0].url);
    expect(rewritten.pathname).toBe("/work/fyxer.md");
    expect(rewritten.search).toBe("?ref=agent");
  });

  it("answers a 404 with a markdown body for any client that did not ask for HTML", async () => {
    const handler = routingHandler();
    const res = await withAgentRepresentation(get("/gone", "*/*"), handler);

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
    const body = await res.text();
    expect(body).toMatch(/^# 404/m);
    expect(body).toContain("/gone");
    expect(body).toContain("/llms.txt");
  });

  it("answers a 404 with a markdown body when no Accept header was sent at all", async () => {
    const res = await withAgentRepresentation(get("/gone"), routingHandler());
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it("still renders the HTML 404 page for a browser", async () => {
    const res = await withAgentRepresentation(get("/gone", "text/html,*/*;q=0.8"), routingHandler());
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("asks the renderer for HTML even when the client wanted markdown, because it selects the representation itself", async () => {
    const handler = routingHandler();
    await withAgentRepresentation(get("/login", "text/markdown"), handler);
    expect(handler.mock.calls[0]![0].headers.get("accept")).toMatch(/text\/html/);
  });

  it("falls back to HTML on a page with no markdown twin, rather than erroring", async () => {
    const res = await withAgentRepresentation(get("/login", "text/markdown"), routingHandler());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("answers a missing path with a markdown 404 even when the renderer refuses non-HTML requests", async () => {
    const res = await withAgentRepresentation(get("/gone", "text/markdown"), routingHandler());
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
    expect(await res.text()).toMatch(/^# 404/m);
  });

  it("leaves a successful non-negotiable response exactly as the handler built it", async () => {
    const handler = vi.fn(() =>
      Promise.resolve(new Response("ok", { headers: { "Content-Type": "text/plain" }, status: 200 })),
    );
    const res = await withAgentRepresentation(get("/llms.txt", "text/plain"), handler);

    expect(res.status).toBe(200);
    expect(res.headers.get("vary")).toBeNull();
    expect(await res.text()).toBe("ok");
  });
});
