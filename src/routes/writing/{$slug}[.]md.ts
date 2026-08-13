import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { buildWritingEntryMeta } from "#/lib/content/page-meta";
import { findWritingEntry } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/writing/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const entry = findWritingEntry(params.slug);
        if (!entry) {
          return new Response("Not found", { status: 404 });
        }

        const meta = buildWritingEntryMeta(entry);
        const markdown = buildMarkdownPage({
          title: meta.title,
          description: meta.description,
          path: `/writing/${entry.slug}`,
          body: entry.source,
          extraFrontmatter: {
            published: entry.published,
            ...(entry.updated ? { updated: entry.updated } : {}),
          },
        });

        return new Response(markdown, {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": MARKDOWN_CONTENT_TYPE,
          },
          status: 200,
        });
      },
    },
  },
});
