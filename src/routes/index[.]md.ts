import { buildSiteIndexMarkdown } from "#/lib/content/site-index";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

/**
 * The site root's markdown representation. Reachable directly (the canonical
 * `.md` URL for the homepage, which is otherwise an interactive chat with no
 * static prose) and served for `GET /` when a client negotiates markdown.
 */
export const Route = createFileRoute("/index.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSiteIndexMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
