import type { WorkMeta } from "./work-meta";
import type { WritingMeta } from "./writing-meta";

import bioMd from "../../../content/bio.md?raw";
import earlyCareerMd from "../../../content/early-career.md?raw";
import educationMd from "../../../content/education.md?raw";
import fyxerMd from "../../../content/fyxer.md?raw";
import impactLebanonMd from "../../../content/impact-lebanon.md?raw";
import leWagonMd from "../../../content/le-wagon.md?raw";
import localistaMd from "../../../content/localista.md?raw";
import personalMd from "../../../content/personal.md?raw";
import shopifyMd from "../../../content/shopify.md?raw";
import skylaMd from "../../../content/skyla.md?raw";
import techStackMd from "../../../content/tech-stack.md?raw";
import ragPortfolioMd from "../../../content/writing/rag-portfolio-with-a-blocking-eval-gate.md?raw";
import { WORK_META } from "./work-meta";
import { WRITING_META } from "./writing-meta";

const WORK_SOURCES: Record<string, string> = {
  fyxer: fyxerMd,
  localista: localistaMd,
  skyla: skylaMd,
  shopify: shopifyMd,
  "le-wagon": leWagonMd,
  "impact-lebanon": impactLebanonMd,
  "early-career": earlyCareerMd,
};

export interface WorkEntry extends WorkMeta {
  source: string;
}

export const WORK_ENTRIES: WorkEntry[] = WORK_META.map((meta) => {
  const source = WORK_SOURCES[meta.slug];
  if (!source) {
    throw new Error(`No markdown source registered for work entry "${meta.slug}"`);
  }
  return { ...meta, source };
});

const WRITING_SOURCES: Record<string, string> = {
  "rag-portfolio-with-a-blocking-eval-gate": ragPortfolioMd,
};

export interface WritingEntry extends WritingMeta {
  source: string;
}

/** Newest first, so the index and the sitemap agree on order without re-sorting. */
export const WRITING_ENTRIES: WritingEntry[] = WRITING_META.map((meta) => {
  const source = WRITING_SOURCES[meta.slug];
  if (!source) {
    throw new Error(`No markdown source registered for article "${meta.slug}"`);
  }
  return { ...meta, source };
});

export function findWritingEntry(slug: string): WritingEntry | undefined {
  return WRITING_ENTRIES.find((entry) => entry.slug === slug);
}

export const ABOUT_SOURCES = [bioMd, personalMd];
export const SKILLS_SOURCES = [techStackMd];
export const EDUCATION_SOURCES = [educationMd];

export function findWorkEntry(slug: string): WorkEntry | undefined {
  return WORK_ENTRIES.find((entry) => entry.slug === slug);
}
