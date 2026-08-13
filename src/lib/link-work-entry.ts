import { WORK_META } from "#/lib/content/work-meta";

/** The real work entry slugs, used to build the `link_work_entry` tool's z.enum input. */
export const WORK_ENTRY_SLUGS = WORK_META.map((entry) => entry.slug);

export interface LinkWorkEntryOutput {
  company: string;
  role: string;
  slug: string;
  url: string;
}

/**
 * Builds the `link_work_entry` tool output from a slug. Never throws: an unknown
 * slug falls back to the work index instead of failing the tool call.
 */
export function buildLinkWorkEntryOutput(slug: string): LinkWorkEntryOutput {
  const entry = WORK_META.find((meta) => meta.slug === slug);
  if (!entry) {
    return { company: "Lucien George", role: "", slug, url: "/work" };
  }
  return { company: entry.company, role: entry.role, slug: entry.slug, url: `/work/${entry.slug}` };
}
