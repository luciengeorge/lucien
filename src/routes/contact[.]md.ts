import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { CONTACT_META } from "#/lib/content/page-meta";
import { CONTACT_SOURCES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildContactMarkdown(): string {
  return buildMarkdownPage({
    title: CONTACT_META.title,
    description: CONTACT_META.description,
    path: "/contact",
    body: CONTACT_SOURCES.map((source) => source.trim()).join("\n\n"),
  });
}

export const Route = createFileRoute("/contact.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildContactMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
