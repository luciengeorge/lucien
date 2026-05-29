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
import { WORK_META } from "./work-meta";

const WORK_SOURCES: Record<string, string> = {
  fyxer: fyxerMd,
  localista: localistaMd,
  skyla: skylaMd,
  shopify: shopifyMd,
  "le-wagon": leWagonMd,
  "impact-lebanon": impactLebanonMd,
  "early-career": earlyCareerMd,
};

export interface WorkEntry {
  slug: string;
  company: string;
  role: string;
  period: string;
  summary: string;
  source: string;
}

export const WORK_ENTRIES: WorkEntry[] = WORK_META.map((meta) => {
  const source = WORK_SOURCES[meta.slug];
  if (!source) {
    throw new Error(`No markdown source registered for work entry "${meta.slug}"`);
  }
  return { ...meta, source };
});

export const ABOUT_SOURCES = [bioMd, personalMd];
export const SKILLS_SOURCES = [techStackMd];
export const EDUCATION_SOURCES = [educationMd];

export function findWorkEntry(slug: string): WorkEntry | undefined {
  return WORK_ENTRIES.find((entry) => entry.slug === slug);
}
