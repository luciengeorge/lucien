/**
 * Single source of truth for article metadata (slug, title, dates, summary).
 *
 * Mirrors `work-meta.ts` and exists for the same reason: no Vite `?raw` imports,
 * so `tests/e2e/` can consume it. The runtime `WRITING_ENTRIES` in `registry.ts`
 * joins each row with its markdown body.
 *
 * Adding an article: add the markdown under `content/writing/`, register it in
 * `registry.ts`, and add a row here. `registry.test.ts` fails if they drift.
 */
export interface WritingMeta {
  slug: string;
  /** The headline: the page's H1, the JSON-LD headline, and the index listing. */
  title: string;
  /**
   * A shorter `<title>` / og:title / twitter:title, before the " | Lucien George"
   * suffix. Set it when `title` plus the suffix runs past 60 characters.
   */
  seoTitle?: string;
  /** Meta description (and og/twitter description). Keep it within 155 characters. */
  description: string;
  /** ISO date (YYYY-MM-DD). Rendered as datePublished, and the list sorts on it. */
  published: string;
  /** ISO date, when the piece has been revised since publishing. */
  updated?: string;
  summary: string;
}

export const WRITING_META: readonly WritingMeta[] = [
  {
    slug: "rag-portfolio-with-a-blocking-eval-gate",
    title: "A portfolio that answers questions about me, gated by an LLM judge",
    seoTitle: "RAG portfolio with a blocking eval gate",
    description:
      "How this site's AI assistant works: one markdown source for the pages and the RAG index, and an eval harness that blocks pull requests on regressions.",
    published: "2026-08-13",
    summary:
      "The same markdown renders the pages and grounds the chat, and a 57-case eval suite runs the real retrieval pipeline on every pull request. Including the run where the gate finally failed, and what it caught was the harness rather than the assistant.",
  },
];
