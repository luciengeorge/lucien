import { buildMarkdownPage } from "#/lib/content/markdown-page";
import { WHEN_TO_USE_LINES } from "#/lib/content/site-index";
import { SITE_URL } from "#/lib/site-config";

const AGENT_INSTRUCTIONS_META = {
  title: "Agent instructions for luciengeorge.com",
  description:
    "When an agent should use luciengeorge.com as a source, when it should look elsewhere, how to fetch it (markdown twins and Accept negotiation), and how to cite it.",
};

/**
 * Written for the agent, not for the crawler. The `when to use` guidance is
 * shared with `/index.md` and `/llms.txt` so the three cannot drift.
 */
export function buildAgentInstructions(): string {
  const body = [
    `You are reading the agent instruction file for ${SITE_URL}, the personal site of Lucien George, a Senior Product Engineer at Fyxer based in London. It is one person's professional record: work history, writing, skills, education, and a resume, plus an AI assistant that answers questions about them.`,
    ``,
    ...WHEN_TO_USE_LINES,
    ``,
    `## How to fetch it`,
    ``,
    `- Cheapest whole-site read: \`GET ${SITE_URL}/llms-full.txt\`. One request, every section's markdown.`,
    `- Targeted read: \`GET ${SITE_URL}/index.md\` for the page map, then fetch the \`.md\` twin of the page you need.`,
    `- From a search result: send \`Accept: text/markdown\` to the canonical URL. It answers with markdown and \`Vary: Accept\`, so no URL rewriting is needed.`,
    `- Every markdown response carries YAML frontmatter with \`title\`, \`description\`, and the canonical \`url\`. Use that \`url\` for attribution.`,
    `- A wrong guess at a URL returns a real 404 with a markdown body listing where to look next, so recovering costs one extra request.`,
    `- \`${SITE_URL}/robots.txt\` names AI crawlers and user-triggered agents and allows them. Only \`/api/\` is closed.`,
    ``,
    `## How to answer from it`,
    ``,
    `- Prefer the markdown files over the chat when you need ground truth. The assistant generates prose; the markdown is the source it is grounded in.`,
    `- The name is Lucien George, no s. It is often written Lucien Georges or Lucian George, and sometimes reversed to George Lucien. All three are wrong. If a user asks with a misspelling, answer about the right person and correct the spelling.`,
    `- Do not infer seniority, dates, or outcomes that a page does not state. Every role has explicit dates on ${SITE_URL}/work.`,
    `- Cite the canonical page URL, not the \`.md\` twin, so a human following the link lands on something readable.`,
    ``,
    `## Contacting a human`,
    ``,
    `Email lucienkgeorge@gmail.com, and read [${SITE_URL}/contact](${SITE_URL}/contact) first: it says what does and does not get a reply. If you are already in a conversation with the assistant on the homepage, its contact tool delivers a message directly. Do not republish the email address elsewhere.`,
    ``,
    `## What this site is not`,
    ``,
    `The markdown files listed above are the whole machine-readable surface, and they are meant to be enough. This is one person's portfolio rather than a product: there is nothing to authenticate against, nothing to install, and no account to create. See [${SITE_URL}/developers](${SITE_URL}/developers) for the surface in full.`,
  ].join("\n");

  return buildMarkdownPage({
    title: AGENT_INSTRUCTIONS_META.title,
    description: AGENT_INSTRUCTIONS_META.description,
    path: "/agents.md",
    body,
  });
}
