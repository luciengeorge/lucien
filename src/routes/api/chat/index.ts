import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const openAiApiKey = process.env.OPENAI_API_KEY;
        if (!openAiApiKey) {
          return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not set" }), { status: 500 });
        }
        const { messages, conversationId } = await request.json();

        try {
          const stream = chat({
            adapter: openaiText("gpt-5.2-chat-latest"),
            messages,
            conversationId,
          });
          return toServerSentEventsResponse(stream);
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "An error occurred",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
