import type { UIMessage } from "ai";

import { describe, expect, it } from "vitest";

import {
  ChatConversationStateSchema,
  ChatRequestSchema,
  getTextFromMessage,
  parseSerializedMessages,
  StoredUIMessageSchema,
} from "./chat-types";

describe("parseSerializedMessages", () => {
  it("parses an array of serialized JSON messages into UIMessage shape", () => {
    const messages = [
      JSON.stringify({
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "hello" }],
      }),
      JSON.stringify({
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "hi" }],
      }),
    ];
    const parsed = parseSerializedMessages(messages);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.id).toBe("msg-1");
    expect(parsed[1]?.role).toBe("assistant");
  });

  it("returns an empty array for empty input", () => {
    expect(parseSerializedMessages([])).toEqual([]);
  });

  it("preserves arbitrary part types (tool calls, etc.)", () => {
    const messages = [
      JSON.stringify({
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "text", text: "calling tool" },
          { type: "tool-download_resume", toolCallId: "call_1", state: "input-available" },
        ],
      }),
    ];
    const parsed = parseSerializedMessages(messages);
    expect(parsed[0]?.parts).toHaveLength(2);
    expect(parsed[0]?.parts[1]).toMatchObject({ type: "tool-download_resume", toolCallId: "call_1" });
  });

  it("throws on invalid role", () => {
    const messages = [JSON.stringify({ id: "x", role: "robot", parts: [] })];
    expect(() => parseSerializedMessages(messages)).toThrow();
  });

  it("throws on missing required fields", () => {
    expect(() => parseSerializedMessages([JSON.stringify({ id: "x", role: "user" })])).toThrow();
    expect(() => parseSerializedMessages([JSON.stringify({ role: "user", parts: [] })])).toThrow();
  });

  it("throws on malformed JSON string", () => {
    expect(() => parseSerializedMessages(["{not json"])).toThrow();
  });
});

describe("ChatRequestSchema", () => {
  it("accepts a valid id + message payload", () => {
    const result = ChatRequestSchema.safeParse({
      id: "convo_abc",
      message: { id: "msg_1", role: "user", parts: [{ type: "text", text: "hi" }] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty conversation id", () => {
    const result = ChatRequestSchema.safeParse({
      id: "",
      message: { id: "m", role: "user", parts: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects when conversation id isn't a string", () => {
    const result = ChatRequestSchema.safeParse({
      id: 42,
      message: { id: "m", role: "user", parts: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = ChatRequestSchema.safeParse({
      id: "c",
      message: { id: "m", role: "system-prompt", parts: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing message id", () => {
    const result = ChatRequestSchema.safeParse({
      id: "c",
      message: { role: "user", parts: [] },
    });
    expect(result.success).toBe(false);
  });
});

describe("getTextFromMessage", () => {
  function uiMessage(parts: Array<{ type: string; text?: string }>): UIMessage {
    return StoredUIMessageSchema.parse({ id: "m", role: "user", parts });
  }

  it("returns empty string for undefined input", () => {
    expect(getTextFromMessage(undefined)).toBe("");
  });

  it("returns empty string when no text parts", () => {
    expect(getTextFromMessage(uiMessage([{ type: "tool-x" }]))).toBe("");
  });

  it("returns the text of a single text part", () => {
    expect(getTextFromMessage(uiMessage([{ type: "text", text: "hi" }]))).toBe("hi");
  });

  it("concatenates multiple text parts with a space", () => {
    expect(
      getTextFromMessage(
        uiMessage([
          { type: "text", text: "hello" },
          { type: "text", text: "world" },
        ]),
      ),
    ).toBe("hello world");
  });

  it("ignores non-text parts between text parts", () => {
    expect(
      getTextFromMessage(
        uiMessage([{ type: "text", text: "before" }, { type: "tool-x" }, { type: "text", text: "after" }]),
      ),
    ).toBe("before after");
  });

  it("trims leading/trailing whitespace", () => {
    expect(getTextFromMessage(uiMessage([{ type: "text", text: "  spaced  " }]))).toBe("spaced");
  });
});

describe("ChatConversationStateSchema", () => {
  it("accepts null conversation with empty messages (fresh session)", () => {
    const result = ChatConversationStateSchema.safeParse({
      conversation: null,
      serializedMessages: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts populated conversation", () => {
    const result = ChatConversationStateSchema.safeParse({
      conversation: {
        id: "convo_1",
        createdAt: 1,
        updatedAt: 2,
        sessionId: "sess_1",
        title: "Hi",
      },
      serializedMessages: ["{}"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown shape", () => {
    expect(ChatConversationStateSchema.safeParse({ foo: "bar" }).success).toBe(false);
  });
});
