import { cn } from "#/lib/utils";

/**
 * Lucien's mark: a bracket drawn as four mitred strokes, an open frame with a
 * notch out of the right edge.
 *
 * It fills with `currentColor` rather than a fixed value, so the same file
 * serves the ink masthead and any inverted surface without a second copy. The
 * wordmark sits beside it and carries the accessible name, so the mark itself
 * is hidden from assistive tech.
 */
const MARK_PATHS = [
  "M9.5 80 L80 80 L90 90 L0 90 L9.5 80 Z",
  "M9.101 0 L73.82 0 L64 10 L73.82 10 L9.101 10 L20.5 10 L9.101 0 Z",
  "M0 0 L10 10 L10 80 L0 90 L0 0 Z",
  "M80 59.864 L90 51 L90 79.864 L80 70.364 L80 59.864 Z",
];

export function LedgerMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="none"
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
    >
      {MARK_PATHS.map((d) => (
        <path d={d} fill="currentColor" fillRule="nonzero" key={d} />
      ))}
    </svg>
  );
}
