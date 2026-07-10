import { WORK_ENTRIES } from "#/lib/content/registry";
import { CACHE_HEADER, SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

function buildLlmsIndex(): string {
  const sections = [
    `# Lucien George`,
    ``,
    `> Senior Product Engineer at Fyxer. Builds products end-to-end, teaches, races karts, and runs ultras in London. Originally from Beirut, Lebanon.`,
    ``,
    `Lucien's personal portfolio is structured as an AI chat ("Poof") backed by a RAG index of these markdown sources. The static pages below are the same content rendered as crawlable HTML.`,
    ``,
    `## About`,
    `- [About Lucien](${SITE_URL}/about): Bio, background, family, interests, and personal life.`,
    `- [Skills & tech stack](${SITE_URL}/skills): Languages, frameworks, and tools Lucien uses.`,
    `- [Education](${SITE_URL}/education): McGill, UNSW Sydney exchange, Le Wagon, Harvard Business School.`,
    `- [Resume](${SITE_URL}/resume): Full resume with PDF download.`,
    ``,
    `## Work history`,
    `- [Work index](${SITE_URL}/work): All roles and outcomes.`,
    ...WORK_ENTRIES.map(
      (entry) => `- [${entry.role} at ${entry.company}](${SITE_URL}/work/${entry.slug}): ${entry.summary}`,
    ),
    ``,
    `## Optional`,
    `- [llms-full.txt](${SITE_URL}/llms-full.txt): Concatenated raw markdown of every content section, intended for LLM ingestion.`,
    ``,
  ];
  return sections.join("\n");
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsIndex(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": "text/plain; charset=utf-8",
          },
          status: 200,
        }),
    },
  },
});
