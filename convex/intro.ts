import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { v } from "convex/values";

import type { QueryCtx } from "./_generated/server";

import { internal } from "./_generated/api";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { stripDashes } from "./stripDashes";

/** Bump when the prompt or model changes, so the next refresh writes a new intro for unchanged content. */
const INTRO_VERSION = "portfolio-intro:gpt-5.6-luna:v6";
const INTRO_SYSTEM_PROMPT = `You are Poof, Lucien George's AI portfolio assistant.

Write the cached first assistant message for a new visitor on Lucien's portfolio chat page.

Requirements:
- Start by introducing yourself as Poof.
- Briefly say what you can help with on this page.
- Give a warm introduction to Lucien in one slightly longer paragraph grounded in the provided content.
- End with a gentle invitation to ask about his work, background, projects, or interests.
- Be warm, concise, and polished.
- Do not mention that this response is cached.

Everything published about Lucien (the same content the chat answers from):
{corpus}`;

/**
 * Run by CI whenever content/ lands on main (scripts/refresh-intro.ts), with the corpus built
 * exactly as the chat route builds it. One intro per prompt version and content hash, so a rerun
 * on unchanged content costs nothing and a content edit always gets a fresh intro.
 */
export const refreshIntro = internalAction({
  args: { contentHash: v.string(), corpus: v.string() },
  handler: async (ctx, { contentHash, corpus }): Promise<{ generated: boolean; key: string }> => {
    const key = `${INTRO_VERSION}:${contentHash}`;
    // Already written for this content (a rerun, or content rolled back): make it current again.
    if (await ctx.runMutation(internal.intro.promoteIntro, { key })) return { generated: false, key };

    const { text } = await generateText({
      model: openai("gpt-5.6-luna"),
      // A function replacer, so `$&`-style sequences in the content go in verbatim.
      system: INTRO_SYSTEM_PROMPT.replace("{corpus}", () => corpus),
      prompt: "Write the first assistant message.",
    });
    await ctx.runMutation(internal.intro.storeIntro, { key, text: stripDashes(text) });
    return { generated: true, key };
  },
});

/** Strictly after the current intro, even within the same millisecond. */
async function nextPromotedAt(ctx: QueryCtx): Promise<number> {
  const current = await ctx.db.query("intros").withIndex("by_promoted_at").order("desc").first();
  return Math.max(Date.now(), (current?.promotedAt ?? 0) + 1);
}

export const promoteIntro = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const intro = await ctx.db
      .query("intros")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (!intro) return false;
    await ctx.db.patch(intro._id, { promotedAt: await nextPromotedAt(ctx) });
    return true;
  },
});

export const storeIntro = internalMutation({
  args: { key: v.string(), text: v.string() },
  handler: async (ctx, { key, text }) => {
    await ctx.db.insert("intros", { key, promotedAt: await nextPromotedAt(ctx), text });
  },
});

export const latestIntro = internalQuery({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("intros").withIndex("by_promoted_at").order("desc").first())?.text ?? null,
});

/** The current intro (latest written or re-promoted), or null before the first refresh: callers then show their static fallback. */
export const getCachedIntro = action({
  args: {},
  handler: async (ctx): Promise<string | null> => await ctx.runQuery(internal.intro.latestIntro, {}),
});
