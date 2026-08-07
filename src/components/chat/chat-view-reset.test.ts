import { describe, expect, it } from "vitest";

import { shouldResetConversationView } from "./chat-view-reset";

const conversation = (id: string) => ({ id });

describe("shouldResetConversationView", () => {
  it("does not reset when the homepage's first conversation arrives", () => {
    // The homepage document is edge-cached with no conversation and creates one
    // on mount. Remounting there would replay every entry animation.
    expect(shouldResetConversationView(null, conversation("abc"))).toBe(false);
  });

  it("resets when the visitor deliberately starts a new conversation", () => {
    expect(shouldResetConversationView(conversation("abc"), conversation("def"))).toBe(true);
  });

  it("does not reset when the same conversation is re-reported", () => {
    expect(shouldResetConversationView(conversation("abc"), conversation("abc"))).toBe(false);
  });

  it("does not reset when a conversation is cleared without a replacement", () => {
    expect(shouldResetConversationView(conversation("abc"), null)).toBe(false);
  });
});
