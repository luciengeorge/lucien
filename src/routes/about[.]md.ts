import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { ABOUT_META } from "#/lib/content/page-meta";
import { ABOUT_SOURCES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildAboutMarkdown(): string {
  return buildMarkdownPage({
    title: ABOUT_META.title,
    description: ABOUT_META.description,
    path: "/about",
    body: ABOUT_SOURCES.map((source) => source.trim()).join("\n\n"),
  });
}

export const Route = createFileRoute("/about.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildAboutMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
