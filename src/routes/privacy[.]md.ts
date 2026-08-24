import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { PRIVACY_META } from "#/lib/content/page-meta";
import { PRIVACY_SOURCES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildPrivacyMarkdown(): string {
  return buildMarkdownPage({
    title: PRIVACY_META.title,
    description: PRIVACY_META.description,
    path: "/privacy",
    body: PRIVACY_SOURCES.map((source) => source.trim()).join("\n\n"),
  });
}

export const Route = createFileRoute("/privacy.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildPrivacyMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
