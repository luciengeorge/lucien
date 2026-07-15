/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import type { Id } from "./_generated/dataModel";

import { internal } from "./_generated/api";
import { buildClusteringPrompt, buildDigestBlocks } from "./digest";
import schema from "./schema";

const modules = import.meta.glob("./**/!(*.test).{ts,js}");

async function insertUserMessage(
  t: ReturnType<typeof convexTest>,
  conversationId: Id<"conversations">,
  createdAt: number,
  text: string,
  index: number,
) {
  await t.run(async (ctx) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      createdAt,
      role: "user",
      uiMessageId: `msg-${index}`,
    });
    await ctx.db.insert("messageParts", {
      conversationId,
      messageId,
      order: 0,
      partJson: JSON.stringify({ text, type: "text" }),
      textPreview: text,
      type: "text",
    });
  });
}

async function insertAssistantMessage(
  t: ReturnType<typeof convexTest>,
  conversationId: Id<"conversations">,
  createdAt: number,
  index: number,
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("messages", {
      conversationId,
      createdAt,
      role: "assistant",
      uiMessageId: `asst-${index}`,
    });
  });
}

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

describe("getRecentUserQuestions", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it("excludes messages older than the window and includes messages inside it", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const conversation = await t.run(async (ctx) => ctx.db.insert("conversations", { createdAt: now, updatedAt: now }));

    await insertUserMessage(t, conversation, now - 8 * DAY_MS, "old question outside the window", 1);
    await insertUserMessage(t, conversation, now - 1 * DAY_MS, "recent question inside the window", 2);

    const questions = await t.query(internal.digest.getRecentUserQuestions, { sinceMs: now - 7 * DAY_MS });

    expect(questions).toEqual(["recent question inside the window"]);
  });

  it("only collects text from role === 'user' messages", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const conversation = await t.run(async (ctx) => ctx.db.insert("conversations", { createdAt: now, updatedAt: now }));

    await insertAssistantMessage(t, conversation, now - 1 * DAY_MS, 1);
    await insertUserMessage(t, conversation, now - 1 * DAY_MS, "a real visitor question", 2);

    const questions = await t.query(internal.digest.getRecentUserQuestions, { sinceMs: now - 7 * DAY_MS });

    expect(questions).toEqual(["a real visitor question"]);
  });

  it("caps the number of returned questions at maxQuestions", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const conversation = await t.run(async (ctx) => ctx.db.insert("conversations", { createdAt: now, updatedAt: now }));

    for (let i = 0; i < 5; i += 1) {
      await insertUserMessage(t, conversation, now - i * 1000, `question ${i}`, i);
    }

    const questions = await t.query(internal.digest.getRecentUserQuestions, {
      maxQuestions: 2,
      sinceMs: now - 7 * DAY_MS,
    });

    expect(questions).toHaveLength(2);
  });

  it("only scans the most recent maxMessagesScanned messages", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const conversation = await t.run(async (ctx) => ctx.db.insert("conversations", { createdAt: now, updatedAt: now }));

    // Oldest message is a user question, but it falls outside the scanned window
    // once newer messages push it past maxMessagesScanned.
    await insertUserMessage(t, conversation, now - 5000, "oldest question, should be scanned out", 0);
    await insertAssistantMessage(t, conversation, now - 4000, 1);
    await insertAssistantMessage(t, conversation, now - 3000, 2);

    const questions = await t.query(internal.digest.getRecentUserQuestions, {
      maxMessagesScanned: 2,
      sinceMs: now - 7 * DAY_MS,
    });

    expect(questions).toEqual([]);
  });

  it("performs a single bounded index-range read (no MultiplePaginatedDatabaseQueries risk) for a window with more than maxMessagesScanned messages", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const conversation = await t.run(async (ctx) => ctx.db.insert("conversations", { createdAt: now, updatedAt: now }));

    // More messages than the default MAX_MESSAGES_SCANNED would have required a second
    // .paginate() call under the old implementation, which Convex forbids per function.
    for (let i = 0; i < 250; i += 1) {
      await insertUserMessage(t, conversation, now - i * 1000, `question ${i}`, i);
    }

    const questions = await t.query(internal.digest.getRecentUserQuestions, { sinceMs: now - 7 * DAY_MS });

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(150);
  });
});
