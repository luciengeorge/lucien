const DASH = /(\s*)([–—])(\s*)/g;

/** A digit on both sides means a range ("2020–2024"), where a tight hyphen is correct. */
function isNumericRange(text: string, dashIndex: number, matchLength: number): boolean {
  const before = text[dashIndex - 1];
  const after = text[dashIndex + matchLength];
  return before !== undefined && after !== undefined && /\d/.test(before) && /\d/.test(after);
}

/**
 * Replaces em-dashes (U+2014) and en-dashes (U+2013) with a plain hyphen.
 *
 * The hyphen is only left tight for a numeric range ("2020–2024" -> "2020-2024").
 * Everywhere else it gets spaces, because a tight dash between words is a
 * parenthetical rather than a range and a bare hyphen welds the two words into
 * one: "his own ventures—including" became "ventures-including", and
 * "Localista—Lucien" read as a compound surname. That shipped to the live
 * homepage intro, so the spacing here is load-bearing rather than cosmetic.
 */
export function stripDashes(text: string): string {
  return text.replace(DASH, (match, before: string, _dash: string, after: string, offset: number) => {
    if (isNumericRange(text, offset, match.length)) return "-";

    // Space each side that had whitespace, or that sits against a word
    // character. A dash with nothing either side stays a bare hyphen.
    const left = before.length > 0 || /\w/.test(text[offset - 1] ?? "") ? " " : "";
    const right = after.length > 0 || /\w/.test(text[offset + match.length] ?? "") ? " " : "";
    return `${left}-${right}`;
  });
}
