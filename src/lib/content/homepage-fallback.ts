import { renderMarkdown } from "#/lib/content/markdown";
import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";

/**
 * The homepage without JavaScript.
 *
 * The homepage is a chat, so with scripting off it is an inert transcript and a
 * dead textbox. Anything reading the raw document (an AI crawler, a
 * text-mode browser, a reader with scripting blocked) needs the substance the
 * conversation would otherwise have to be asked for, which is what this is: the
 * bio, the roles with dates, the writing, and the routes into the rest of the
 * site including the markdown ones.
 *
 * `<noscript>` is the right container rather than a hidden div: with scripting
 * enabled the parser treats its contents as raw text, so it never enters the
 * DOM and costs nothing at runtime, and with scripting disabled it renders as
 * the page it should have been.
 */
function fallbackMarkdown(): string {
  const roles = WORK_META.map((entry) => `- **${entry.role} at ${entry.company}**, ${entry.period}. ${entry.summary}`);
  const writing = WRITING_META.map((entry) => `- **${entry.title}**, ${entry.published}. ${entry.summary}`);

  return [
    `## About Lucien`,
    ``,
    `Lucien George is a fullstack developer and product engineer based in London, United Kingdom, originally from Beirut, Lebanon. As a Senior Product Engineer at Fyxer he leads development of the notetaker: a native macOS and Windows desktop app that records meetings without sending a bot into the call, together with the AI tooling that searches and extracts insight from what it captures. Before Fyxer he worked at Shopify and taught at Le Wagon, and he co-founded Localista, Skyla, and Impact Lebanon.`,
    ``,
    `He works across TypeScript, JavaScript, React and the TanStack ecosystem, Ruby on Rails, Python, Electron, and native mobile, with Convex and SQL behind them. He speaks English, French, and Arabic. Outside work he teaches, races karts, and runs ultras. His name is Lucien George, no s.`,
    ``,
    `## Work history`,
    ``,
    ...roles,
    ``,
    `## Writing`,
    ``,
    ...writing,
    ``,
    `## Read the rest`,
    ``,
    `- [About](/about) and [Skills](/skills): background, and the stack in detail.`,
    `- [Work history](/work): every role, with context and outcomes.`,
    `- [Writing](/writing): how the things above actually work.`,
    `- [Education](/education) and [Resume](/resume): degrees, programs, and the full resume with a PDF.`,
    `- [Contact](/contact): how to reach him, and what to reach him about.`,
    ``,
    `## For crawlers and agents`,
    ``,
    `This chat is not the only way in, and it is not the source of truth. The same content is served as markdown: [/index.md](/index.md) maps the site, [/llms.txt](/llms.txt) indexes it, [/llms-full.txt](/llms-full.txt) is all of it in one file, and [/agents.md](/agents.md) says when this site is the right source and how to cite it. Every page also has a \`.md\` twin and answers \`Accept: text/markdown\` on its canonical URL. See [/developers](/developers).`,
  ].join("\n");
}

/** Pre-rendered so `<noscript>` can take it as a single opaque HTML string. */
export const HOMEPAGE_FALLBACK_HTML = renderMarkdown(fallbackMarkdown());
