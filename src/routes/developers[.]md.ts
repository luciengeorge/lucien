import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { DEVELOPERS_META } from "#/lib/content/page-meta";
import { DEVELOPERS_SOURCES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildDevelopersMarkdown(): string {
  return buildMarkdownPage({
    title: DEVELOPERS_META.title,
    description: DEVELOPERS_META.description,
    path: "/developers",
    body: DEVELOPERS_SOURCES.map((source) => source.trim()).join("\n\n"),
  });
}

export const Route = createFileRoute("/developers.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildDevelopersMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
