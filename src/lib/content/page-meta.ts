/**
 * Single source of truth for each content page's SEO title/description, so
 * `buildSeoHead` (the HTML <head>) and the sibling `.md` routes render the
 * exact same strings and can never drift apart.
 */
export interface PageMeta {
  title: string;
  description: string;
}

/** Search results truncate past these lengths; `page-meta.test.ts` holds every page to them. */
export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_DESCRIPTION_MAX_LENGTH = 155;

export const TITLE_SUFFIX = " | Lucien George";

/**
 * The homepage, and the default every route inherits from `__root.tsx`. Most
 * search traffic is someone typing his name, so the title and description say
 * who he is, where, and for whom, before anything about the site itself.
 */
export const HOME_META: PageMeta = {
  title: "Lucien George, Senior Product Engineer in London",
  description:
    "Lucien George is a Senior Product Engineer at Fyxer in London, ex-Shopify. He builds AI products and desktop apps, like a meeting recorder with no bot.",
};

/** One-paragraph identity shared by the JSON-LD Person description and the llms.txt summary. */
export const PERSON_SUMMARY =
  "Senior Product Engineer at Fyxer in London, previously at Shopify. Builds AI products and desktop apps end to end, teaches, races karts, and runs ultras. Originally from Beirut, Lebanon.";

export const ABOUT_META: PageMeta = {
  title: "About Lucien George",
  description:
    "Lucien George is a senior product engineer at Fyxer, based in London and originally from Beirut. He builds products, races karts, and runs ultras.",
};

export const CONTACT_META: PageMeta = {
  title: "Contact Lucien George",
  description:
    "How to reach Lucien George: email, the assistant's contact tool, and social profiles, plus where he is based and which languages he reads.",
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
    "Lucien George holds a BEng in Software Engineering from McGill, with a UNSW Sydney exchange, and studied at Le Wagon London and Harvard Business School.",
};

export const WORK_INDEX_META: PageMeta = {
  title: "Lucien George | Work history",
  description:
    "Lucien George's work history: Fyxer, Localista, Skyla, Shopify, Le Wagon, Impact Lebanon, and early roles. Each role with context, scope, and outcomes.",
};

export const RESUME_META: PageMeta = {
  title: "Lucien George Resume | Senior Product Engineer, London",
  description:
    "Resume of Lucien George, Senior Product Engineer at Fyxer in London. Previously at Shopify and Le Wagon; co-founded Localista and Skyla. PDF download.",
};

export const WRITING_INDEX_META: PageMeta = {
  title: "Lucien George | Writing on product engineering",
  description:
    "Writing by Lucien George on product engineering: AI apps and retrieval, desktop and native apps, testing, and the parts that turned out to be wrong.",
};

/**
 * Per-article title/description for a `/writing/$slug` page. The `<title>` uses
 * the short `seoTitle` when the article has one, because a long headline plus
 * the suffix gets cut off in search results; the page's H1 is always `title`.
 */
export function buildWritingEntryMeta(entry: { title: string; seoTitle?: string; description: string }): PageMeta {
  return {
    title: `${entry.seoTitle ?? entry.title}${TITLE_SUFFIX}`,
    description: entry.description,
  };
}

/** Per-entry title/description for a `/work/$slug` page, derived from its WorkEntry. */
export function buildWorkEntryMeta(entry: { company: string; role: string; summary: string }): PageMeta {
  return {
    title: `${entry.role} at ${entry.company}${TITLE_SUFFIX}`,
    description: entry.summary,
  };
}
