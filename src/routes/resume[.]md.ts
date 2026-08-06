import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { RESUME_META } from "#/lib/content/page-meta";
import { loadResume } from "#/lib/resume/load";
import { renderResumeMarkdown } from "#/lib/resume/markdown";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildResumeMarkdown(): string {
  return buildMarkdownPage({
    title: RESUME_META.title,
    description: RESUME_META.description,
    path: "/resume",
    body: renderResumeMarkdown(loadResume()),
  });
}

export const Route = createFileRoute("/resume.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildResumeMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
