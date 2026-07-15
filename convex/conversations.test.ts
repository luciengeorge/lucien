/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/!(*.test).{ts,js}");

const SESSION_A = "session-a";
const SESSION_B = "session-b";

interface PersistedMessage {
  id: string;
  role: "assistant" | "system" | "user";
  parts: Array<Record<string, unknown>>;
  createdAt?: number;
  modelId?: string;
  provider?: string;
  metadata?: Record<string, unknown> | null;
}

function persistedMessage(overrides: Partial<PersistedMessage> & { id: string; role: PersistedMessage["role"] }) {
  return JSON.stringify({
    parts: [{ type: "text", text: "hello" }],
    ...overrides,
  });
}

describe("createConversation", () => {
  test("inserts a row tagged with the sessionId, with matching createdAt/updatedAt", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });

    const row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.sessionId).toBe(SESSION_A);
    expect(row?.createdAt).toBe(row?.updatedAt);
    expect(row?.title).toBeUndefined();
  });
});

describe("getConversationById", () => {
  test("returns null when conversation doesn't exist", async () => {
    const t = convexTest(schema, modules);
    const fakeId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("conversations", { createdAt: 0, updatedAt: 0, sessionId: "x" });
      await ctx.db.delete(id);
      return id;
    });
    const result = await t.query(api.conversations.getConversationById, {
      conversationId: fakeId,
      sessionId: SESSION_A,
    });
    expect(result).toBeNull();
  });

  test("returns null when sessionId doesn't match (ownership gate)", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    const result = await t.query(api.conversations.getConversationById, {
      conversationId: id,
      sessionId: SESSION_B,
    });
    expect(result).toBeNull();
  });

  test("returns conversation + serialized messages for the owning session", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({ id: "msg-1", role: "user", parts: [{ type: "text", text: "hi" }] }),
    });
    const result = await t.query(api.conversations.getConversationById, {
      conversationId: id,
      sessionId: SESSION_A,
    });
    expect(result).not.toBeNull();
    expect(result?.conversation.id).toBe(id);
    expect(result?.serializedMessages).toHaveLength(1);
    const parsed = JSON.parse(result!.serializedMessages[0]!);
    expect(parsed).toMatchObject({ id: "msg-1", role: "user" });
  });

  test("filters out legacy 'Introduce yourself first as Poof' bootstrap user messages", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "bootstrap",
        role: "user",
        parts: [{ type: "text", text: "Introduce yourself first as Poof and welcome the visitor" }],
      }),
    });
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "real",
        role: "user",
        parts: [{ type: "text", text: "Where does Lucien work?" }],
      }),
    });
    const result = await t.query(api.conversations.getConversationById, {
      conversationId: id,
      sessionId: SESSION_A,
    });
    expect(result?.serializedMessages).toHaveLength(1);
    expect(JSON.parse(result!.serializedMessages[0]!).id).toBe("real");
  });
});

describe("upsertConversationMessage", () => {
  test("throws when conversation not found", async () => {
    const t = convexTest(schema, modules);
    const ghostId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("conversations", { createdAt: 0, updatedAt: 0, sessionId: "x" });
      await ctx.db.delete(id);
      return id;
    });
    await expect(() =>
      t.mutation(api.conversations.upsertConversationMessage, {
        conversationId: ghostId,
        sessionId: SESSION_A,
        messageJson: persistedMessage({ id: "m", role: "user" }),
      }),
    ).rejects.toThrowError(/not found/i);
  });

  test("throws when sessionId doesn't match (access denied)", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    await expect(() =>
      t.mutation(api.conversations.upsertConversationMessage, {
        conversationId: id,
        sessionId: SESSION_B,
        messageJson: persistedMessage({ id: "m", role: "user" }),
      }),
    ).rejects.toThrowError(/access denied/i);
  });

  test("inserts new message with parts indexed and extracts type/textPreview/toolName", async () => {
    const t = convexTest(schema, modules);
    const conversationId = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "m1",
        role: "assistant",
        modelId: "gpt-5.4-mini",
        provider: "openai",
        parts: [
          { type: "text", text: "Lucien works at Fyxer." },
          { type: "tool-download_resume", toolCallId: "call_1", toolName: "download_resume", state: "input-available" },
        ],
      }),
    });

    const { messages, parts } = await t.run(async (ctx) => {
      const msgs = await ctx.db.query("messages").collect();
      const ps = await ctx.db.query("messageParts").collect();
      return { messages: msgs, parts: ps };
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "assistant", modelId: "gpt-5.4-mini", provider: "openai" });
    expect(parts).toHaveLength(2);
    const textPart = parts.find((p) => p.type === "text");
    expect(textPart?.textPreview).toBe("Lucien works at Fyxer.");
    expect(textPart?.conversationId).toBe(conversationId);
    const toolPart = parts.find((p) => p.type === "tool-download_resume");
    expect(toolPart).toMatchObject({
      toolCallId: "call_1",
      toolName: "download_resume",
      toolState: "input-available",
    });
    expect(toolPart?.conversationId).toBe(conversationId);
  });

  test("updates an existing message in place (same uiMessageId): replaces parts atomically", async () => {
    const t = convexTest(schema, modules);
    const conversationId = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "m-streaming",
        role: "assistant",
        parts: [{ type: "text", text: "Lucien" }],
      }),
    });
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "m-streaming",
        role: "assistant",
        parts: [{ type: "text", text: "Lucien works at Fyxer." }],
      }),
    });

    const { messages, parts } = await t.run(async (ctx) => ({
      messages: await ctx.db.query("messages").collect(),
      parts: await ctx.db.query("messageParts").collect(),
    }));
    expect(messages).toHaveLength(1);
    expect(parts).toHaveLength(1);
    expect(parts[0]?.textPreview).toBe("Lucien works at Fyxer.");
  });

  test("sets conversation title from first non-bootstrap user message (and only once)", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });

    // bootstrap should NOT set the title
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "bootstrap",
        role: "user",
        parts: [{ type: "text", text: "Introduce yourself first as Poof and say hello" }],
      }),
    });
    let row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row?.title).toBeUndefined();

    // first real user message sets the title
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "Where does Lucien work?" }],
      }),
    });
    row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row?.title).toBe("Where does Lucien work?");

    // subsequent user message does NOT overwrite title
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "u2",
        role: "user",
        parts: [{ type: "text", text: "What's his stack?" }],
      }),
    });
    row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row?.title).toBe("Where does Lucien work?");
  });

  test("truncates derived title to 120 chars", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    const longText = "a".repeat(200);
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: longText }],
      }),
    });
    const row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row?.title?.length).toBe(120);
  });

  test("bumps updatedAt on each write", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    const initial = await t.run(async (ctx) => ctx.db.get(id));

    // wait a tick to ensure Date.now() advances
    await new Promise((r) => setTimeout(r, 5));
    await t.mutation(api.conversations.upsertConversationMessage, {
      conversationId: id,
      sessionId: SESSION_A,
      messageJson: persistedMessage({ id: "u1", role: "user" }),
    });
    const after = await t.run(async (ctx) => ctx.db.get(id));
    expect((after?.updatedAt ?? 0) >= (initial?.updatedAt ?? 0)).toBe(true);
  });

  test("rejects invalid message JSON via Zod", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.conversations.createConversation, { sessionId: SESSION_A });
    await expect(() =>
      t.mutation(api.conversations.upsertConversationMessage, {
        conversationId: id,
        sessionId: SESSION_A,
        messageJson: JSON.stringify({ role: "robot" }),
      }),
    ).rejects.toThrowError();
  });
});
