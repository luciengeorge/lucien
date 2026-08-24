import { buildAgentInstructions } from "#/lib/content/agent-instructions";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

/**
 * The agent instruction file: when to reach for this site, when not to, and how
 * to read it without guessing. Deliberately a separate document from
 * `/index.md`, which leads with the content, and from `/llms.txt`, which is a
 * link index.
 */
export const Route = createFileRoute("/agents.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildAgentInstructions(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
