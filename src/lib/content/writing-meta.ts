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
  title: string;
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
    description:
      "How this site's AI assistant works end to end: markdown as the single source for both the pages and the RAG index, and an eval harness that blocks pull requests when answer quality regresses.",
    published: "2026-08-13",
    summary:
      "The same markdown renders the pages and grounds the chat, and a 57-case eval suite runs the real retrieval pipeline on every pull request. Including the part where the gate turned out to be measuring nothing.",
  },
];
