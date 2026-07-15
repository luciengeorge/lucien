import { describe, expect, it } from "vitest";

import { buildClusteringPrompt, buildDigestBlocks } from "./digest";

describe("buildClusteringPrompt", () => {
  it("numbers each question and includes the total count", () => {
    const prompt = buildClusteringPrompt(["What does Lucien do?", "Where does he work?"]);
    expect(prompt).toContain("2 visitor questions");
    expect(prompt).toContain("1. What does Lucien do?");
    expect(prompt).toContain("2. Where does he work?");
  });

  it("handles an empty question list", () => {
    const prompt = buildClusteringPrompt([]);
    expect(prompt).toContain("0 visitor questions");
  });
});

describe("buildDigestBlocks", () => {
  it("includes the total question count in the header block", () => {
    const blocks = buildDigestBlocks([{ count: 3, label: "career background" }], 3);
    expect(blocks[0]?.text?.text).toContain("3 questions");
  });

  it("renders one line per topic with its count", () => {
    const blocks = buildDigestBlocks(
      [
        { count: 5, label: "technical stack" },
        { count: 2, label: "current projects" },
      ],
      7,
    );
    const body = blocks[1]?.text?.text ?? "";
    expect(body).toContain("technical stack: 5");
    expect(body).toContain("current projects: 2");
  });

  it("falls back to a no-topics line when the model returns no topics", () => {
    const blocks = buildDigestBlocks([], 0);
    expect(blocks[1]?.text?.text).toMatch(/no clear topics/i);
  });

  it("never includes plain-text-only blocks (no mrkdwn fields)", () => {
    const blocks = buildDigestBlocks([{ count: 1, label: "career background" }], 1);
    for (const block of blocks) {
      expect(block.text?.type).toBe("plain_text");
    }
  });
});
