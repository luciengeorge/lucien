/**
 * Single source of truth for each content page's SEO title/description, so
 * `buildSeoHead` (the HTML <head>) and the sibling `.md` routes render the
 * exact same strings and can never drift apart.
 */
export interface PageMeta {
  title: string;
  description: string;
}

export const ABOUT_META: PageMeta = {
  title: "About Lucien George",
  description:
    "Lucien George is a senior product engineer at Fyxer, based in London and originally from Beirut. He builds products, races karts, and runs ultras.",
};

export const CONTACT_META: PageMeta = {
  title: "Contact Lucien George",
  description:
    "How to reach Lucien George: email, the assistant's contact tool, and social profiles. What to get in touch about, and what never gets a reply.",
};

export const DEVELOPERS_META: PageMeta = {
  title: "Lucien George | Developer and agent resources",
  description:
    "The machine-readable surface of luciengeorge.com: llms.txt, llms-full.txt, a markdown twin for every page, Accept: text/markdown negotiation, JSON-LD, and the open-source repository behind the site.",
};

export const PRIVACY_META: PageMeta = {
  title: "Privacy | Lucien George",
  description:
    "What luciengeorge.com collects: chat conversations, analytics, and error monitoring, who processes each, and how to have your data deleted.",
};

export const SKILLS_META: PageMeta = {
  title: "Lucien George | Tech stack & skills",
  description:
    "Lucien George's tech stack: TypeScript, React, the TanStack ecosystem, Convex, Tailwind, Electron, Ruby on Rails, Python, native iOS/Android.",
};

export const EDUCATION_META: PageMeta = {
  title: "Lucien George | Education",
  description:
    "Lucien George studied software engineering at McGill University, did an exchange at UNSW Sydney, attended Le Wagon London, and completed Harvard Business School's Families in Business program.",
};

export const WORK_INDEX_META: PageMeta = {
  title: "Lucien George | Work history",
  description:
    "Lucien George's work history: Fyxer, Localista, Skyla, Shopify, Le Wagon, Impact Lebanon, and early roles. Each role with context, scope, and outcomes.",
};

export const RESUME_META: PageMeta = {
  title: "Lucien George | Resume",
  description:
    "Resume of Lucien George, Senior Product Engineer at Fyxer. Past: Shopify, Le Wagon, and startups. McGill BEng in Software Engineering.",
};

export const WRITING_INDEX_META: PageMeta = {
  title: "Lucien George | Writing",
  description:
    "Writing by Lucien George on product engineering: AI applications and retrieval, desktop and native app work, testing, and the parts that turned out to be wrong.",
};

/** Per-article title/description for a `/writing/$slug` page. */
export function buildWritingEntryMeta(entry: { title: string; description: string }): PageMeta {
  return {
    title: `${entry.title} | Lucien George`,
    description: entry.description,
  };
}

/** Per-entry title/description for a `/work/$slug` page, derived from its WorkEntry. */
export function buildWorkEntryMeta(entry: { company: string; role: string; summary: string }): PageMeta {
  return {
    title: `${entry.role} at ${entry.company} | Lucien George`,
    description: entry.summary,
  };
}
