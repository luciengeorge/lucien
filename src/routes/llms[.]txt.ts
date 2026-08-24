import { WORK_ENTRIES, WRITING_ENTRIES } from "#/lib/content/registry";
import { WHEN_TO_USE_LINES } from "#/lib/content/site-index";
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
    ...WHEN_TO_USE_LINES,
    ``,
    `Full instructions for agents, including how to cite this site: [${SITE_URL}/agents.md](${SITE_URL}/agents.md).`,
    ``,
    `## About`,
    `- [About Lucien](${SITE_URL}/about): Bio, background, family, interests, and personal life. ([Markdown](${SITE_URL}/about.md))`,
    `- [Skills & tech stack](${SITE_URL}/skills): Languages, frameworks, and tools Lucien uses. ([Markdown](${SITE_URL}/skills.md))`,
    `- [Education](${SITE_URL}/education): McGill, UNSW Sydney exchange, Le Wagon, Harvard Business School. ([Markdown](${SITE_URL}/education.md))`,
    `- [Resume](${SITE_URL}/resume): Full resume with PDF download. ([Markdown](${SITE_URL}/resume.md))`,
    `- [Contact](${SITE_URL}/contact): How to reach Lucien, and what to reach him about. ([Markdown](${SITE_URL}/contact.md))`,
    `- [Privacy](${SITE_URL}/privacy): What this site collects, who processes it, and how to have it deleted. ([Markdown](${SITE_URL}/privacy.md))`,
    ``,
    `## Work history`,
    `- [Work index](${SITE_URL}/work): All roles and outcomes. ([Markdown](${SITE_URL}/work.md))`,
    ...WORK_ENTRIES.map(
      (entry) =>
        `- [${entry.role} at ${entry.company}](${SITE_URL}/work/${entry.slug}): ${entry.summary} ([Markdown](${SITE_URL}/work/${entry.slug}.md))`,
    ),
    ``,
    `## Writing`,
    `- [Writing index](${SITE_URL}/writing): Articles by Lucien on what he has built and how it works. ([Markdown](${SITE_URL}/writing.md))`,
    ...WRITING_ENTRIES.map(
      (entry) =>
        `- [${entry.title}](${SITE_URL}/writing/${entry.slug}): ${entry.summary} ([Markdown](${SITE_URL}/writing/${entry.slug}.md))`,
    ),
    ``,
    `## For agents`,
    `- [Agent instructions](${SITE_URL}/agents.md): When to use this site, how to fetch it, the markdown conventions, and how to cite it.`,
    `- [Site index](${SITE_URL}/index.md): The site root as markdown, with the full page map.`,
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
