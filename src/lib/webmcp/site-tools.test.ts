import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";
import { describe, expect, it, vi } from "vitest";

import {
  MAX_OUTPUT_CHARS,
  SITE_PAGES,
  SITE_TOOL_DEFINITIONS,
  listPages,
  openPage,
  readPage,
  type ToolResult,
} from "./site-tools";

function textOf(result: ToolResult): string {
  return result.content.map((block) => block.text).join("");
}

function markdownResponse(body: string): Response {
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" }, status: 200 });
}

describe("SITE_PAGES", () => {
  it("covers every top-level page, work entry, and article", () => {
    const ids = SITE_PAGES.map((page) => page.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "home",
        "about",
        "work",
        "writing",
        "skills",
        "education",
        "resume",
        "contact",
        "privacy",
      ]),
    );
    for (const { slug } of WORK_META) expect(ids).toContain(`work/${slug}`);
    for (const { slug } of WRITING_META) expect(ids).toContain(`writing/${slug}`);
  });

  it("only points at same-origin paths", () => {
    for (const page of SITE_PAGES) {
      expect(page.path.startsWith("/")).toBe(true);
      expect(page.path.startsWith("//")).toBe(false);
      expect(page.markdownPath).toMatch(/^\/[a-z0-9/-]+\.md$/);
    }
  });
});

describe("tool definitions", () => {
  it("stay inside the WebMCP budgets", () => {
    for (const tool of SITE_TOOL_DEFINITIONS) {
      expect(tool.name).toMatch(/^[a-z_]{1,30}$/);
      expect(tool.description.length).toBeLessThanOrEqual(500);
      for (const property of Object.values(tool.inputSchema.properties)) {
        expect(property.description.length).toBeLessThanOrEqual(150);
      }
    }
  });

  it("marks only the pure reads as read-only and never declares a false hint", () => {
    const byName = Object.fromEntries(SITE_TOOL_DEFINITIONS.map((tool) => [tool.name, tool.annotations]));
    expect(byName).toEqual({
      list_pages: { readOnlyHint: true },
      open_page: undefined,
      read_page: { readOnlyHint: true },
    });
  });

  it("restricts the page argument to the allowlist", () => {
    for (const tool of SITE_TOOL_DEFINITIONS.filter((definition) => definition.name !== "list_pages")) {
      expect(tool.inputSchema.properties.page?.enum).toEqual(SITE_PAGES.map((page) => page.id));
    }
  });
});

describe("listPages", () => {
  it("lists every page id within the output budget", () => {
    const text = textOf(listPages());
    expect(text.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS);
    for (const page of SITE_PAGES) expect(text).toContain(page.id);
  });
});

describe("readPage", () => {
  it("fetches the page's markdown twin without cookies", async () => {
    const fetcher = vi.fn(async () => markdownResponse("# About\n\nHello."));
    const result = await readPage({ page: "about" }, { fetcher });

    expect(fetcher).toHaveBeenCalledWith("/about.md", expect.objectContaining({ credentials: "omit" }));
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(textOf(result))).toEqual({ page: "about", part: 1, totalParts: 1, text: "# About\n\nHello." });
  });

  it("reads the homepage from /index.md", async () => {
    const fetcher = vi.fn(async () => markdownResponse("# Lucien"));
    await readPage({ page: "home" }, { fetcher });
    expect(fetcher).toHaveBeenCalledWith("/index.md", expect.anything());
  });

  it("splits long pages into parts that fit the output budget", async () => {
    const body = "word ".repeat(1000);
    const fetcher = vi.fn(async () => markdownResponse(body));

    const first = await readPage({ page: "about" }, { fetcher });
    const firstText = textOf(first);
    const parsed = JSON.parse(firstText);
    expect(firstText.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS);
    expect(parsed.part).toBe(1);
    expect(parsed.totalParts).toBeGreaterThan(1);
    expect(parsed.nextPart).toBe(2);

    let rebuilt = parsed.text;
    for (let part = 2; part <= parsed.totalParts; part++) {
      const next = JSON.parse(textOf(await readPage({ page: "about", part }, { fetcher })));
      rebuilt += next.text;
      if (part === parsed.totalParts) expect(next.nextPart).toBeUndefined();
    }
    expect(rebuilt).toBe(body);
  });

  it.each([
    ["an unknown page", { page: "admin" }],
    ["a path", { page: "/about" }],
    ["an absolute URL", { page: "https://evil.example/x" }],
    ["a traversal", { page: "../about" }],
    ["a missing page", {}],
  ])("rejects %s without fetching", async (_label, input) => {
    const fetcher = vi.fn();
    const result = await readPage(input, { fetcher });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(JSON.parse(textOf(result))).toMatchObject({ code: "unknown_page", retryable: false });
  });

  it("rejects a part past the end", async () => {
    const fetcher = vi.fn(async () => markdownResponse("short"));
    const result = await readPage({ page: "about", part: 3 }, { fetcher });
    expect(result.isError).toBe(true);
    expect(JSON.parse(textOf(result))).toMatchObject({ code: "part_out_of_range", retryable: false });
  });

  it("returns a retryable error, not a throw, when the fetch fails", async () => {
    const fetcher = vi.fn(async () => new Response("nope", { status: 503 }));
    const result = await readPage({ page: "about" }, { fetcher });
    expect(result.isError).toBe(true);
    expect(JSON.parse(textOf(result))).toMatchObject({ code: "fetch_failed", retryable: true });
  });

  it("returns a retryable error when the network throws", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const result = await readPage({ page: "about" }, { fetcher });
    expect(result.isError).toBe(true);
    expect(JSON.parse(textOf(result))).toMatchObject({ code: "fetch_failed", retryable: true });
  });

  it("refuses a response that is not markdown", async () => {
    const fetcher = vi.fn(async () => new Response("<html></html>", { headers: { "Content-Type": "text/html" } }));
    const result = await readPage({ page: "about" }, { fetcher });
    expect(result.isError).toBe(true);
    expect(JSON.parse(textOf(result))).toMatchObject({ code: "fetch_failed" });
  });
});

describe("openPage", () => {
  it("navigates to the page's path and waits for it", async () => {
    const navigate = vi.fn(async () => {});
    const result = await openPage({ page: "work/fyxer" }, { navigate });

    expect(navigate).toHaveBeenCalledWith("/work/fyxer");
    expect(result.isError).toBeUndefined();
    expect(textOf(result)).toContain("/work/fyxer");
  });

  it.each([{ page: "https://evil.example" }, { page: "//evil.example" }, { page: "javascript:alert(1)" }, {}])(
    "never navigates off the allowlist (%o)",
    async (input) => {
      const navigate = vi.fn();
      const result = await openPage(input, { navigate });
      expect(navigate).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
    },
  );
});
