import { fetchAuthAction } from "#/lib/auth-server";
import { openai } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, generateText, streamText } from "ai";

import systemPrompt from "../../../../content/system-prompt.md?raw";
import { api } from "../../../../convex/_generated/api";

const QUERY_EXPANSION_PROMPT = `Rewrite the user's question into a better search query for finding relevant information about Lucien George's portfolio, career, projects, and personal life. Add context and relevant keywords. Return ONLY the rewritten query, nothing else.

Examples:
- "what do you do?" → "Lucien George current role job position software engineer work"
- "tell me about yourself" → "Lucien George bio background personal story origin education career"
- "what's your stack?" → "Lucien George tech stack programming languages frameworks tools TypeScript React"
- "any side projects?" → "Lucien George side projects startups co-founder Localista Skyla open source"
- "where did you study?" → "Lucien George education university McGill Le Wagon Harvard degree"`;

async function expandQuery(query: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-5.4-nano"),
      system: QUERY_EXPANSION_PROMPT,
      prompt: query,
    });
    return text;
  } catch {
    return query;
  }
}

export const Route = createFileRoute("/api/chat/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json();

        const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
        const query = lastUserMessage?.content ?? lastUserMessage?.parts?.[0]?.text ?? "";

        const expandedQuery = await expandQuery(query);
        console.log(`Query: "${query}" → Expanded: "${expandedQuery}"`);

        let context = "";
        try {
          context = await fetchAuthAction(api.search.searchContext, { query: expandedQuery });
        } catch (e) {
          console.error("RAG search failed:", e);
        }

        const prompt = systemPrompt.replace("{retrieved_context}", context);

        const result = streamText({
          model: openai("gpt-5.4-mini"),
          system: prompt,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
