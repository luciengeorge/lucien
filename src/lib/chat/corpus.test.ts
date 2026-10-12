import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { readCorpusFromDisk } from "../../../evals/corpus";
import { renderCorpus } from "./corpus";

const CONTENT_DIR = join(import.meta.dirname, "..", "..", "..", "content");

describe("renderCorpus", () => {
  it("wraps each document with its source, in a stable order", () => {
    const corpus = renderCorpus([
      { path: "shopify.md", text: "Shopify.\n" },
      { path: "bio.md", text: "Bio." },
    ]);
    expect(corpus).toBe(
      '<document source="bio.md">\nBio.\n</document>\n\n<document source="shopify.md">\nShopify.\n</document>',
    );
  });

  it("leaves out the system prompt, which is not content", () => {
    const corpus = renderCorpus([
      { path: "bio.md", text: "Bio." },
      { path: "system-prompt.md", text: "You are Poof" },
    ]);
    expect(corpus).not.toContain("You are Poof");
  });
});

describe("readCorpusFromDisk", () => {
  /* The eval harness must grade the same corpus the chat route sends. */
  it("includes every markdown file under content/, nested ones too, except the prompt", () => {
    const corpus = readCorpusFromDisk(CONTENT_DIR);
    const files = readdirSync(CONTENT_DIR, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".md") && file !== "system-prompt.md");

    expect(files.length).toBeGreaterThan(10);
    for (const file of files) expect(corpus).toContain(`<document source="${file}">`);
    expect(corpus).not.toContain('source="system-prompt.md"');
  });
});
