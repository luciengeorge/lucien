import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { WORK_INDEX_META } from "#/lib/content/page-meta";
import { WORK_ENTRIES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildWorkIndexBody(): string {
  const lines = [
    "Where Lucien has worked, what he built, and what he learned along the way. Each entry links to its own markdown page.",
    "",
  ];
  for (const entry of WORK_ENTRIES) {
    lines.push(`## [${entry.role} at ${entry.company}](${SITE_URL}/work/${entry.slug}.md)`);
    lines.push("");
    lines.push(`${entry.company} · ${entry.period}`);
    lines.push("");
    lines.push(entry.summary);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function buildWorkIndexMarkdown(): string {
  return buildMarkdownPage({
    title: WORK_INDEX_META.title,
    description: WORK_INDEX_META.description,
    path: "/work",
    body: buildWorkIndexBody(),
  });
}

export const Route = createFileRoute("/work.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildWorkIndexMarkdown(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        }),
    },
  },
});
