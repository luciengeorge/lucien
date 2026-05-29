import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("converts paragraphs into <p> tags", () => {
    const html = renderMarkdown("hello world");
    expect(html).toContain("<p>");
    expect(html).toContain("hello world");
  });

  it("renders multiple paragraphs", () => {
    const html = renderMarkdown("first\n\nsecond");
    expect(html.match(/<p>/g)).toHaveLength(2);
  });

  it("renders inline emphasis", () => {
    expect(renderMarkdown("**bold** and *italic*")).toContain("<strong>bold</strong>");
  });

  it("renders links", () => {
    const html = renderMarkdown("see [github](https://github.com)");
    expect(html).toContain('<a href="https://github.com">github</a>');
  });

  it("renders lists", () => {
    const html = renderMarkdown("- one\n- two\n- three");
    expect(html).toContain("<ul>");
    expect(html.match(/<li>/g)).toHaveLength(3);
  });

  it("renders GFM-style autolinks (gfm: true)", () => {
    const html = renderMarkdown("https://example.com");
    expect(html).toContain('<a href="https://example.com">');
  });

  it("trims leading/trailing whitespace before rendering", () => {
    expect(renderMarkdown("\n\n  hello  \n\n")).toContain("<p>hello</p>");
  });

  it("returns a string (sync mode)", () => {
    expect(typeof renderMarkdown("x")).toBe("string");
  });
});
