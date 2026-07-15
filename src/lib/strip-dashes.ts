const DASH_WITH_SURROUNDING_SPACE = /(\s*)[–—](\s*)/g;

/**
 * Replaces em-dashes (U+2014) and en-dashes (U+2013) with a plain hyphen.
 * Preserves a single space on each side that had whitespace (" — " -> " - "),
 * and leaves tight ranges untouched (e.g. "2020–2024" -> "2020-2024").
 */
export function stripDashes(text: string): string {
  return text.replace(DASH_WITH_SURROUNDING_SPACE, (_match, before: string, after: string) => {
    const left = before.length > 0 ? " " : "";
    const right = after.length > 0 ? " " : "";
    return `${left}-${right}`;
  });
}
