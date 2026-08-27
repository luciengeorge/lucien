import { renderMarkdown } from "#/lib/content/markdown";
import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";

/**
 * The homepage's static substance: the bio, the roles with dates, the writing,
 * and the routes into the rest of the site including the markdown ones.
 *
 * This lived in a `<noscript>` first, which was wrong twice over. A crawler
 * that extracts the main content of a page strips `noscript` along with the
 * landmark elements, so it counted for nothing (measured: the homepage read as
 * 1,317 chars with a single heading while this sat in the document). And a
 * visitor who *can* run scripts still gets a chat with no static answer to
 * "who is this", which is the one question a first visit asks.
 *
 * A closed `<details>` fixes both. It is one muted line until someone opens
 * it, so the chat keeps the page; its content is in the DOM either way, so
 * anything reading the document sees the prose and the heading outline; and it
 * opens without scripting, which is what the fallback was for.
 */
function fallbackMarkdown(): string {
  const roles = WORK_META.map((entry) => `- **${entry.role} at ${entry.company}**, ${entry.period}. ${entry.summary}`);
  const writing = WRITING_META.map((entry) => `- **${entry.title}**, ${entry.published}. ${entry.summary}`);

  return [
    `## About Lucien`,
    ``,
    `Lucien George is a fullstack developer and product engineer based in London, United Kingdom, originally from Beirut, Lebanon. As a Senior Product Engineer at Fyxer he founded the notetaker: a native macOS and Windows desktop app that records meetings without sending a bot into the call, together with the AI tooling that searches and extracts insight from what it captures. He now works on Fyxer's enterprise product, from SCIM provisioning to Microsoft Marketplace billing. Before Fyxer he worked at Shopify and taught at Le Wagon, and he co-founded Localista, Skyla, and Impact Lebanon.`,
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
    `## Skills`,
    ``,
    `TypeScript and JavaScript first, with React and the TanStack ecosystem (Start, Router, Query, Form), Tailwind CSS, and Convex. Ruby on Rails and Python behind that, Electron for desktop, and native iOS, Android, and React Native for mobile. English, French, and Arabic.`,
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
    `This chat is not the only way in, and it is not the source of truth. The same content is served as markdown: [/index.md](/index.md) maps the site, [/llms.txt](/llms.txt) indexes it, [/llms-full.txt](/llms-full.txt) is all of it in one file, and [/agents.md](/agents.md) says when this site is the right source and how to cite it. Every page also has a \`.md\` twin and answers \`Accept: text/markdown\` on its canonical URL.`,
  ].join("\n");
}

/** Pre-rendered so the disclosure can take it as one opaque HTML string. */
export const HOMEPAGE_FALLBACK_HTML = renderMarkdown(fallbackMarkdown());
