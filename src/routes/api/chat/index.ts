import { fetchAuthAction } from "#/lib/auth-server";
import { chat, streamToText, toServerSentEventsResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "../../../../convex/_generated/api";
import systemPrompt from "../../../../content/system-prompt.md?raw";

const QUERY_EXPANSION_PROMPT = `Rewrite the user's question into a better search query for finding relevant information about Lucien George's portfolio, career, projects, and personal life. Add context and relevant keywords. Return ONLY the rewritten query, nothing else.

Examples:
- "what do you do?" → "Lucien George current role job position software engineer work"
- "tell me about yourself" → "Lucien George bio background personal story origin education career"
- "what's your stack?" → "Lucien George tech stack programming languages frameworks tools TypeScript React"
- "any side projects?" → "Lucien George side projects startups co-founder Localista Skyla open source"
- "where did you study?" → "Lucien George education university McGill Le Wagon Harvard degree"`;

async function expandQuery(query: string): Promise<string> {
  try {
    const stream = chat({
      adapter: openaiText("gpt-5.2-chat-latest"),
      messages: [{ role: "user", content: query }],
      systemPrompts: [QUERY_EXPANSION_PROMPT],
    });
    return await streamToText(stream);
  } catch {
    return query;
  }
}

export const Route = createFileRoute("/api/chat/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.OPENAI_API_KEY) {
          return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not set" }), { status: 500 });
        }

        const { messages, conversationId } = await request.json();

        const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
        const query = lastUserMessage?.content ?? lastUserMessage?.parts?.[0]?.content ?? "";

        const expandedQuery = await expandQuery(query);
        console.log(`Query: "${query}" → Expanded: "${expandedQuery}"`);

        let context = "";
        try {
          context = await fetchAuthAction(api.search.searchContext, { query: expandedQuery });
        } catch (e) {
          console.error("RAG search failed:", e);
        }

        const prompt = systemPrompt.replace("{retrieved_context}", context);

        try {
          const stream = chat({
            adapter: openaiText("gpt-5.2-chat-latest"),
            messages,
            conversationId,
            systemPrompts: [prompt],
          });
          return toServerSentEventsResponse(stream);
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "An error occurred",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
