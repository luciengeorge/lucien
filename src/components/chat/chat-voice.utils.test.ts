import type { ChatConversationState } from "#/lib/chat-types";
import type { UIMessage } from "ai";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildVoiceContext, formatCountdown, isVoiceMessage, waitForVoiceTranscript } from "./chat-voice.utils";

const text = (id: string, role: UIMessage["role"], words: string, metadata?: unknown): UIMessage => ({
  id,
  metadata,
  parts: [{ text: words, type: "text" }],
  role,
});

describe("buildVoiceContext", () => {
  it("is nothing when the visitor has not said anything yet", () => {
    expect(buildVoiceContext([])).toBeNull();
    expect(buildVoiceContext([text("intro", "assistant", "Hi, I'm Poof")])).toBeNull();
  });

  it("writes the chat so far as Visitor and Poof lines", () => {
    const context = buildVoiceContext([
      text("intro", "assistant", "Hi, I'm Poof"),
      text("u1", "user", "What does he build?"),
      text("a1", "assistant", "Mostly AI products."),
    ]);

    expect(context).toContain("Poof: Hi, I'm Poof\nVisitor: What does he build?\nPoof: Mostly AI products.");
  });

  it("skips parts with no words, like tool cards", () => {
    const toolOnly: UIMessage = {
      id: "a2",
      parts: [{ input: {}, state: "input-available", toolCallId: "t1", type: "tool-download_resume" }],
      role: "assistant",
    };
    const context = buildVoiceContext([text("u1", "user", "Resume?"), toolOnly]);

    expect(context?.split("\n").filter((line) => line.startsWith("Poof:"))).toEqual([]);
  });

  it("keeps only the latest turns, within the size cap", () => {
    const messages = Array.from({ length: 30 }, (_, index) =>
      text(`m${index}`, index % 2 ? "assistant" : "user", `turn ${index} ${"x".repeat(300)}`),
    );
    const context = buildVoiceContext(messages) ?? "";

    expect(context.length).toBeLessThanOrEqual(4000);
    expect(context).toContain("turn 29");
    expect(context).not.toContain("turn 9 ");
  });
});

describe("isVoiceMessage", () => {
  it("is true only for turns saved from a call", () => {
    expect(isVoiceMessage(text("v", "user", "hi", { callId: "c", channel: "voice" }))).toBe(true);
    expect(isVoiceMessage(text("t", "user", "hi"))).toBe(false);
    expect(isVoiceMessage(text("o", "user", "hi", { channel: "web" }))).toBe(false);
  });
});

describe("formatCountdown", () => {
  it("reads as minutes and seconds", () => {
    expect(formatCountdown(30)).toBe("0:30");
    expect(formatCountdown(9)).toBe("0:09");
    expect(formatCountdown(0)).toBe("0:00");
  });
});

describe("waitForVoiceTranscript", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const state = (messages: UIMessage[]): ChatConversationState => ({
    conversation: { createdAt: 0, id: "conv-1", updatedAt: 0 },
    serializedMessages: messages.map((message) => JSON.stringify(message)),
  });
  const saved = text("voice-1", "assistant", "Hello", { callId: "call-1", channel: "voice" });

  it("refetches every couple of seconds until the call's turns are saved", async () => {
    const fetchConversation = vi
      .fn<() => Promise<ChatConversationState>>()
      .mockResolvedValueOnce(state([]))
      .mockResolvedValueOnce(state([]))
      .mockResolvedValue(state([saved]));

    const result = waitForVoiceTranscript({ callId: "call-1", fetchConversation });
    await vi.advanceTimersByTimeAsync(4000);

    await expect(result).resolves.toEqual({ found: true, state: state([saved]) });
    expect(fetchConversation).toHaveBeenCalledTimes(3);
  });

  it("ignores turns from an earlier call", async () => {
    const earlier = text("voice-0", "user", "Old", { callId: "call-0", channel: "voice" });
    const fetchConversation = vi.fn(async () => state([earlier]));

    const result = waitForVoiceTranscript({ callId: "call-1", fetchConversation });
    await vi.advanceTimersByTimeAsync(31_000);

    await expect(result).resolves.toEqual({ found: false, state: state([earlier]) });
  });

  it("gives up after about thirty seconds, keeping a failed fetch from ending it early", async () => {
    const fetchConversation = vi
      .fn<() => Promise<ChatConversationState>>()
      .mockRejectedValueOnce(new Error("blip"))
      .mockResolvedValue(state([]));

    const result = waitForVoiceTranscript({ callId: "call-1", fetchConversation });
    await vi.advanceTimersByTimeAsync(31_000);

    await expect(result).resolves.toEqual({ found: false, state: state([]) });
    expect(fetchConversation.mock.calls.length).toBeGreaterThanOrEqual(14);
    expect(fetchConversation.mock.calls.length).toBeLessThanOrEqual(16);
  });

  it("keeps waiting through a read that comes back empty", async () => {
    const fetchConversation = vi
      .fn<() => Promise<ChatConversationState | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValue(state([saved]));

    const result = waitForVoiceTranscript({ callId: "call-1", fetchConversation });
    await vi.advanceTimersByTimeAsync(2000);

    await expect(result).resolves.toEqual({ found: true, state: state([saved]) });
  });

  it("stops when asked to", async () => {
    const fetchConversation = vi.fn(async () => state([]));
    const controller = new AbortController();

    const result = waitForVoiceTranscript({ callId: "call-1", fetchConversation, signal: controller.signal });
    await vi.advanceTimersByTimeAsync(2500);
    controller.abort();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(result).resolves.toEqual({ found: false, state: null });
    expect(fetchConversation).toHaveBeenCalledTimes(2);
  });
});
