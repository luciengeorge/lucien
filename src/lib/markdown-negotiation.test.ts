import { markdownPathFor, prefersHtml, prefersMarkdown } from "#/lib/markdown-negotiation";
import { describe, expect, it } from "vitest";

describe("prefersMarkdown", () => {
  // The vector table published at https://acceptmarkdown.com/guides/accept-parsing
  it.each([
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.8", true],
    ["text/html", false],
    ["text/markdown;q=0, text/html", false],
    ["text/markdown;q=0", false],
    ["*/*", false],
  ])("Accept: %s -> markdown=%s", (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });

  it("treats a missing or blank Accept as no constraint, so the default (HTML) wins", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown(undefined)).toBe(false);
    expect(prefersMarkdown("   ")).toBe(false);
  });

  it("does not match a real browser Accept header", () => {
    const chrome =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
    expect(prefersMarkdown(chrome)).toBe(false);
    expect(prefersMarkdown("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(false);
  });

  it("accepts the text/x-markdown alias", () => {
    expect(prefersMarkdown("text/x-markdown")).toBe(true);
    expect(prefersMarkdown("text/x-markdown, text/html;q=0.5")).toBe(true);
  });

  it("ranks by q-value before specificity", () => {
    expect(prefersMarkdown("text/html;q=0.4, text/markdown;q=0.9")).toBe(true);
    expect(prefersMarkdown("text/html;q=0.9, text/markdown;q=0.4")).toBe(false);
  });

  it("breaks an equal-q tie on specificity, then on the order the client listed them", () => {
    // text/markdown is fully specified, text/* is a subtype wildcard.
    expect(prefersMarkdown("text/*, text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html")).toBe(true);
    expect(prefersMarkdown("text/html, text/markdown")).toBe(false);
  });

  it("lets the most specific entry set the q-value, so a targeted q=0 wins over a wildcard", () => {
    expect(prefersMarkdown("*/*, text/markdown;q=0")).toBe(false);
    expect(prefersMarkdown("*/*;q=0.2, text/markdown;q=0.9")).toBe(true);
  });

  it("serves markdown when the client rejects HTML outright", () => {
    expect(prefersMarkdown("text/markdown, text/html;q=0")).toBe(true);
  });

  it("ignores casing and stray whitespace", () => {
    expect(prefersMarkdown("  TEXT/MARKDOWN ;Q=0.9 , text/html;q=0.1 ")).toBe(true);
  });

  it("ignores media types it cannot parse instead of throwing", () => {
    expect(prefersMarkdown(",,;q=,text/markdown")).toBe(true);
    expect(prefersMarkdown("garbage")).toBe(false);
  });
});

describe("prefersHtml", () => {
  it("is true only when the client names text/html explicitly and does not reject it", () => {
    expect(prefersHtml("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(true);
    expect(prefersHtml("text/html;q=0.8")).toBe(true);
    expect(prefersHtml("*/*")).toBe(false);
    expect(prefersHtml("text/html;q=0")).toBe(false);
    expect(prefersHtml(null)).toBe(false);
  });
});

describe("markdownPathFor", () => {
  it("maps the site root to its canonical markdown URL", () => {
    expect(markdownPathFor("/")).toBe("/index.md");
    expect(markdownPathFor("")).toBe("/index.md");
  });

  it("maps every static content page to its .md twin", () => {
    for (const path of ["/about", "/contact", "/education", "/privacy", "/resume", "/skills", "/work", "/writing"]) {
      expect(markdownPathFor(path)).toBe(`${path}.md`);
    }
  });

  it("maps work and writing entry pages to their .md twins", () => {
    expect(markdownPathFor("/work/fyxer")).toBe("/work/fyxer.md");
    expect(markdownPathFor("/writing/rag-portfolio-with-a-blocking-eval-gate")).toBe(
      "/writing/rag-portfolio-with-a-blocking-eval-gate.md",
    );
  });

  it("tolerates a trailing slash", () => {
    expect(markdownPathFor("/about/")).toBe("/about.md");
    expect(markdownPathFor("/work/fyxer/")).toBe("/work/fyxer.md");
  });

  it("returns null for paths with no markdown representation", () => {
    for (const path of ["/login", "/signup", "/api/chat", "/about.md", "/llms.txt", "/nope", "/work/a/b"]) {
      expect(markdownPathFor(path)).toBeNull();
    }
  });
});
