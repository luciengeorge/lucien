import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { SKILLS_META } from "#/lib/content/page-meta";
import { SKILLS_SOURCES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildSkillsMarkdown(): string {
  return buildMarkdownPage({
    title: SKILLS_META.title,
    description: SKILLS_META.description,
    path: "/skills",
    body: SKILLS_SOURCES.map((source) => source.trim()).join("\n\n"),
  });
}

export const Route = createFileRoute("/skills.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSkillsMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
