import { ABOUT_SOURCES, EDUCATION_SOURCES, SKILLS_SOURCES, WORK_ENTRIES } from "#/lib/content/registry";
import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://www.luciengeorge.com";
const CACHE_HEADER = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

function buildLlmsFull(): string {
  const parts: string[] = [
    `# Lucien George - full content`,
    ``,
    `> Concatenated raw markdown of every public section. This file is intended for ingestion by AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) to ground answers about Lucien in source material. Same canonical content is rendered as HTML at the URLs below.`,
    ``,
    `Canonical site: ${SITE_URL}`,
    ``,
    `---`,
    ``,
    `## About (${SITE_URL}/about)`,
    ``,
    ...ABOUT_SOURCES.map((source) => source.trim()),
    ``,
    `## Education (${SITE_URL}/education)`,
    ``,
    ...EDUCATION_SOURCES.map((source) => source.trim()),
    ``,
    `## Skills & tech stack (${SITE_URL}/skills)`,
    ``,
    ...SKILLS_SOURCES.map((source) => source.trim()),
    ``,
    `## Work history (${SITE_URL}/work)`,
    ``,
  ];

  for (const entry of WORK_ENTRIES) {
    parts.push(`### ${entry.role} at ${entry.company} - ${entry.period} (${SITE_URL}/work/${entry.slug})`);
    parts.push(``);
    parts.push(entry.source.trim());
    parts.push(``);
  }

  return parts.join("\n");
}

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsFull(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": "text/plain; charset=utf-8",
          },
          status: 200,
        }),
    },
  },
});
