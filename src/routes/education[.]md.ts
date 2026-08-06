import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { EDUCATION_META } from "#/lib/content/page-meta";
import { EDUCATION_SOURCES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildEducationMarkdown(): string {
  return buildMarkdownPage({
    title: EDUCATION_META.title,
    description: EDUCATION_META.description,
    path: "/education",
    body: EDUCATION_SOURCES.map((source) => source.trim()).join("\n\n"),
  });
}

export const Route = createFileRoute("/education.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildEducationMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
