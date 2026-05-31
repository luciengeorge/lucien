/**
 * Single source of truth for work entries metadata (slug, company, role, dates, summary).
 *
 * Lives in its own file (without Vite `?raw` markdown imports) so it can be consumed
 * by environments that don't process Vite-specific syntax — notably Playwright e2e
 * specs in `tests/e2e/`. The runtime `WORK_ENTRIES` in `registry.ts` is derived from
 * this list, joining each entry with its markdown source.
 *
 * Adding/removing a work entry: edit this file. The Playwright spec and the registry
 * pick up the change automatically; a sanity vitest test in `registry.test.ts` keeps
 * them aligned in CI.
 */
export interface WorkMeta {
  slug: string;
  company: string;
  role: string;
  period: string;
  summary: string;
  /** Public path to the company logo (under /public/companies), or null when none. */
  logo: string | null;
  /** Brand color used as the logo fallback background. */
  color: string;
}

export const WORK_META: readonly WorkMeta[] = [
  {
    slug: "fyxer",
    company: "Fyxer",
    role: "Senior Product Engineer",
    period: "Sep 2025 — Present",
    summary: "Leads the notetaker desktop app at Fyxer — a background meeting recorder for macOS and Windows.",
    logo: "/companies/fyxer.png",
    color: "#0f172a",
  },
  {
    slug: "localista",
    company: "Localista",
    role: "Co-Founder & CTO",
    period: "Apr 2024 — Jul 2025",
    summary: "Co-founded a B2B event marketing platform; architected the product end-to-end before pivoting.",
    logo: "/companies/localista.png",
    color: "#dc2626",
  },
  {
    slug: "skyla",
    company: "Skyla",
    role: "Co-Founder",
    period: "Sep 2023 — Apr 2024",
    summary:
      "Co-founded an AI-powered customer support chatbot for Shopify stores in the early days of the OpenAI API.",
    logo: "/companies/skyla.png",
    color: "#7c3aed",
  },
  {
    slug: "shopify",
    company: "Shopify",
    role: "Senior Developer",
    period: "Jan 2022 — Sep 2023",
    summary: "Built a native checkout SDK for iOS and Android adopted by Meta-powered apps; cut partner code by 75%.",
    logo: "/companies/shopify.png",
    color: "#5e8e3e",
  },
  {
    slug: "le-wagon",
    company: "Le Wagon",
    role: "Engineering Manager",
    period: "Jan 2019 — Dec 2021",
    summary: "Taught hundreds of bootcamp students, led the London dev team, and shipped Le Wagon's B2B platform.",
    logo: "/companies/le-wagon.png",
    color: "#e11d48",
  },
  {
    slug: "impact-lebanon",
    company: "Impact Lebanon",
    role: "Co-Founder",
    period: "Oct 2019 — Present",
    summary: "Co-founded a Lebanese diaspora non-profit that raised $8.3M for victims of the Beirut explosion.",
    logo: "/companies/impact-lebanon.png",
    color: "#b91c1c",
  },
  {
    slug: "early-career",
    company: "Early career",
    role: "Various",
    period: "2013 — 2019",
    summary: "Hoxton Digital (Rails freelance), Dataflow (Beirut), McGill projects, and early Android apps.",
    logo: "/companies/hoxton-digital.png",
    color: "#1d4ed8",
  },
] as const;
