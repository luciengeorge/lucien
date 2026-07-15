import { describe, expect, it } from "vitest";

import { hasRenderableContent } from "./chat-timeline-message";

describe("hasRenderableContent", () => {
  it("returns false when there are no text, reasoning, or tool parts", () => {
    expect(hasRenderableContent({ hasToolCard: false, reasoningParts: [], textParts: [] })).toBe(false);
  });

  it("returns true when there are text parts", () => {
    expect(hasRenderableContent({ hasToolCard: false, reasoningParts: [], textParts: [{}] })).toBe(true);
  });

  it("returns true when there are reasoning parts", () => {
    expect(hasRenderableContent({ hasToolCard: false, reasoningParts: [{}], textParts: [] })).toBe(true);
  });

  it("returns true when there's a tool card", () => {
    expect(hasRenderableContent({ hasToolCard: true, reasoningParts: [], textParts: [] })).toBe(true);
  });
});
