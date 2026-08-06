import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { buildWorkEntryMeta } from "#/lib/content/page-meta";
import { findWorkEntry } from "#/lib/content/registry";
import { CACHE_HEADER, MARKDOWN_CONTENT_TYPE } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/work/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const entry = findWorkEntry(params.slug);
        if (!entry) {
          return new Response("Not found", { status: 404 });
        }

        const meta = buildWorkEntryMeta(entry);
        const markdown = buildMarkdownPage({
          title: meta.title,
          description: meta.description,
          path: `/work/${entry.slug}`,
          body: entry.source,
          extraFrontmatter: { company: entry.company, role: entry.role, period: entry.period },
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
