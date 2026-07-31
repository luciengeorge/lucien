import { openai } from "@ai-sdk/openai";
import { ActionCache } from "@convex-dev/action-cache";
import { generateText } from "ai";
import { v } from "convex/values";

import { components, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { rag } from "./rag";

const INTRO_CACHE_VERSION = "portfolio-intro:gpt-5.6-luna:v4";
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

const DASH_WITH_SURROUNDING_SPACE = /(\s*)[–—](\s*)/g;

// Mirrors src/lib/strip-dashes.ts, kept local since convex/ bundles separately from src/.
function stripDashes(text: string): string {
  return text.replace(DASH_WITH_SURROUNDING_SPACE, (_match, before: string, after: string) => {
    const left = before.length > 0 ? " " : "";
    const right = after.length > 0 ? " " : "";
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
