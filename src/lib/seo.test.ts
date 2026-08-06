import { describe, expect, it } from "vitest";

import { buildSeoHead } from "./seo";

const BASE_INPUT = {
  title: "Lucien George | Resume",
  description: "Resume description.",
  url: "https://www.luciengeorge.com/resume",
  type: "profile" as const,
};

describe("buildSeoHead", () => {
  it("always includes the canonical link", () => {
    const head = buildSeoHead(BASE_INPUT);
    expect(head.links).toContainEqual({ rel: "canonical", href: BASE_INPUT.url });
  });

  it("does not add a markdown alternate link when markdownUrl is omitted", () => {
    const head = buildSeoHead(BASE_INPUT);
    expect(head.links.some((link) => link.rel === "alternate")).toBe(false);
  });

  it("adds a rel=alternate type=text/markdown link when markdownUrl is provided", () => {
    const head = buildSeoHead({ ...BASE_INPUT, markdownUrl: "https://www.luciengeorge.com/resume.md" });
    expect(head.links).toContainEqual({
      rel: "alternate",
      type: "text/markdown",
      href: "https://www.luciengeorge.com/resume.md",
    });
  });

  it("keeps the canonical link alongside the markdown alternate link", () => {
    const head = buildSeoHead({ ...BASE_INPUT, markdownUrl: "https://www.luciengeorge.com/resume.md" });
    expect(head.links).toContainEqual({ rel: "canonical", href: BASE_INPUT.url });
    expect(head.links).toHaveLength(2);
  });
});
