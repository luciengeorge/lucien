import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { WRITING_INDEX_META } from "#/lib/content/page-meta";
import { WRITING_ENTRIES } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildWritingIndexBody(): string {
  const lines = [
    "Notes on things Lucien has built, how they work, and where they turned out to be wrong. Each entry links to its own markdown page.",
    "",
  ];
  for (const entry of WRITING_ENTRIES) {
    lines.push(`## [${entry.title}](${SITE_URL}/writing/${entry.slug}.md)`);
    lines.push("");
    lines.push(`Published ${entry.published}${entry.updated ? `, updated ${entry.updated}` : ""}`);
    lines.push("");
    lines.push(entry.summary);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export const Route = createFileRoute("/writing.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          buildMarkdownPage({
            title: WRITING_INDEX_META.title,
            description: WRITING_INDEX_META.description,
            path: "/writing",
            body: buildWritingIndexBody(),
          }),
          {
            headers: {
              "Cache-Control": CACHE_HEADER,
              "Content-Type": MARKDOWN_CONTENT_TYPE,
            },
            status: 200,
          },
        ),
    },
  },
});
