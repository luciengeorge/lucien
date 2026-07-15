import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";

import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_QUESTIONS = 200;
const MAX_MESSAGES_SCANNED = 1000;
const PAGE_SIZE = 200;
const DIGEST_MODEL = "gpt-5.4-mini";

const TopicSchema = z.object({
  topics: z
    .array(
      z.object({
        count: z.number().int().nonnegative(),
        label: z.string(),
      }),
    )
    .max(8),
});

export type Topic = z.infer<typeof TopicSchema>["topics"][number];

const CLUSTERING_SYSTEM_PROMPT = `You analyze visitor questions asked to Poof, an AI portfolio assistant on Lucien George's website.

Group the questions into a small set of topic labels (at most 8) with a count of how many questions fall under each. Labels should be short, general categories (e.g. "career background", "technical stack", "current projects"), not verbatim quotes. Do not include any verbatim visitor text in your output, only aggregate topic labels and counts.`;

export function buildClusteringPrompt(questions: string[]): string {
  const numbered = questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
  return `Here are ${questions.length} visitor questions from the last week:\n\n${numbered}\n\nReturn the topic clusters.`;
}

interface SlackBlock {
  elements?: { text: string; type: string }[];
  text?: { text: string; type: string };
  type: string;
}

export function buildDigestBlocks(topics: Topic[], totalQuestions: number): SlackBlock[] {
  const header: SlackBlock = {
    text: { text: `Poof weekly question digest (${totalQuestions} questions)`, type: "plain_text" },
    type: "section",
  };

  if (topics.length === 0) {
    return [
      header,
      {
        text: { text: "No clear topics were found in this window.", type: "plain_text" },
        type: "section",
      },
    ];
  }

  const lines = topics.map((topic) => `${topic.label}: ${topic.count}`).join("\n");
  return [
    header,
    {
      text: { text: lines, type: "plain_text" },
      type: "section",
    },
  ];
}

export const getRecentUserQuestions = internalQuery({
  args: {
    maxMessagesScanned: v.optional(v.number()),
    maxQuestions: v.optional(v.number()),
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    const maxQuestions = args.maxQuestions ?? MAX_QUESTIONS;
    const maxMessagesScanned = args.maxMessagesScanned ?? MAX_MESSAGES_SCANNED;

    const questions: string[] = [];
    let cursor: string | null = null;
    let scanned = 0;
    let windowExceeded = false;

    while (questions.length < maxQuestions && scanned < maxMessagesScanned && !windowExceeded) {
      const page = await ctx.db.query("messages").withIndex("by_created_at").order("desc").paginate({
        cursor,
        numItems: PAGE_SIZE,
      });

      for (const message of page.page) {
        scanned += 1;
        if (message.createdAt < args.sinceMs) {
          windowExceeded = true;
          break;
        }

        if (message.role === "user") {
          const parts = await ctx.db
            .query("messageParts")
            .withIndex("by_message_id", (q) => q.eq("messageId", message._id))
            .collect();
          const textPart = parts.find((part) => part.type === "text" && part.textPreview);
          if (textPart?.textPreview) {
            questions.push(textPart.textPreview);
          }
        }

        if (questions.length >= maxQuestions) break;
      }

      if (page.isDone || windowExceeded) break;
      cursor = page.continueCursor;
    }

    return questions;
  },
});

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const sinceMs = Date.now() - WINDOW_MS;
    const questions: string[] = await ctx.runQuery(internal.digest.getRecentUserQuestions, { sinceMs });

    if (questions.length === 0) {
      console.warn("[digest] no user questions in the last 7 days, skipping digest");
      return;
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("[digest] SLACK_WEBHOOK_URL not set, skipping digest post");
      return;
    }

    let topics: Topic[];
    try {
      const { object } = await generateObject({
        model: openai(DIGEST_MODEL),
        prompt: buildClusteringPrompt(questions),
        schema: TopicSchema,
        system: CLUSTERING_SYSTEM_PROMPT,
      });
      topics = object.topics;
    } catch (error) {
      console.warn("[digest] topic clustering failed", error);
      return;
    }

    const blocks = buildDigestBlocks(topics, questions.length);

    try {
      const response = await fetch(webhookUrl, {
        body: JSON.stringify({ blocks }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        console.warn("[digest] slack webhook responded with a non-ok status", response.status);
      }
    } catch (error) {
      console.warn("[digest] slack webhook post failed", error);
    }
  },
});
