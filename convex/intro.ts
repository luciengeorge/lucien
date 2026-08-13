import { openai } from "@ai-sdk/openai";
import { ActionCache } from "@convex-dev/action-cache";
import { generateText } from "ai";
import { v } from "convex/values";

import { components, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { rag } from "./rag";

const INTRO_CACHE_VERSION = "portfolio-intro:gpt-5.6-luna:v5";
const INTRO_QUERY = "Lucien George bio current role Fyxer product engineer projects background personal intro";
const INTRO_SYSTEM_PROMPT = `You are Poof, Lucien George's AI portfolio assistant.

Write the cached first assistant message for a new visitor on Lucien's portfolio chat page.

Requirements:
- Start by introducing yourself as Poof.
- Briefly say what you can help with on this page.
- Give a warm introduction to Lucien in one slightly longer paragraph grounded in the provided context.
- End with a gentle invitation to ask about his work, background, projects, or interests.
- Be warm, concise, and polished.
- Do not mention that this response is cached.

Retrieved context:
{retrieved_context}`;

const DASH = /(\s*)([–—])(\s*)/g;

/** A digit on both sides means a range ("2020–2024"), where a tight hyphen is correct. */
function isNumericRange(text: string, dashIndex: number, matchLength: number): boolean {
  const before = text[dashIndex - 1];
  const after = text[dashIndex + matchLength];
  return before !== undefined && after !== undefined && /\d/.test(before) && /\d/.test(after);
}

/*
 * Mirrors src/lib/strip-dashes.ts, kept local since convex/ bundles separately
 * from src/. The behaviour is covered by src/lib/strip-dashes.test.ts; if you
 * change one copy, change both.
 *
 * Only a numeric range keeps a tight hyphen. Everywhere else the hyphen is
 * spaced, because a tight dash between words welds them: this function
 * generated the live homepage intro reading "his own ventures-including
 * Impact Lebanon, Skyla, and Localista-Lucien focuses on...".
 */
function stripDashes(text: string): string {
  return text.replace(DASH, (match, before: string, _dash: string, after: string, offset: number) => {
    if (isNumericRange(text, offset, match.length)) return "-";

    const left = before.length > 0 || /\w/.test(text[offset - 1] ?? "") ? " " : "";
    const right = after.length > 0 || /\w/.test(text[offset + match.length] ?? "") ? " " : "";
    return `${left}-${right}`;
  });
}

const introCache = new ActionCache(components.actionCache, {
  action: internal.intro.generateIntro,
  name: INTRO_CACHE_VERSION,
  ttl: 1000 * 60 * 60 * 24 * 30,
});

export const generateIntro = internalAction({
  args: { version: v.string() },
  handler: async (ctx): Promise<string> => {
    const { text: context } = await rag.search(ctx, {
      namespace: "portfolio",
      query: INTRO_QUERY,
      limit: 5,
      vectorScoreThreshold: 0.4,
    });

    const { text } = await generateText({
      model: openai("gpt-5.6-luna"),
      system: INTRO_SYSTEM_PROMPT.replace("{retrieved_context}", context),
      prompt: "Write the first assistant message.",
    });

    return stripDashes(text);
  },
});

export const getCachedIntro = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    return await introCache.fetch(ctx, { version: INTRO_CACHE_VERSION });
  },
});
