/**
 * Markdown content negotiation (RFC 9110 proactive negotiation, as spelled out
 * by acceptmarkdown.com): one URL, two representations. Browsers keep getting
 * HTML; an agent that asks for `text/markdown` gets the page's markdown twin
 * from the same URL, and the response carries `Vary: Accept` so a cache never
 * hands the HTML variant to an agent (or the markdown one to a browser).
 *
 * `Accept` is a ranked list, not a string: substring matching on it reports
 * markdown for a plain Chrome request (which ends in `*\/*;q=0.8`), so this
 * parses entries, ranks them by q-value, and breaks ties by specificity.
 */

/** Media types we treat as "markdown wanted". */
const MARKDOWN_MEDIA_TYPES: ReadonlyArray<readonly [string, string]> = [
  ["text", "markdown"],
  ["text", "x-markdown"],
];

interface AcceptEntry {
  type: string;
  subtype: string;
  quality: number;
  /** Position in the header, used only to break an otherwise exact tie. */
  order: number;
}

interface MediaTypeMatch {
  quality: number;
  /** 3 = exact type match, 2 = `type/*`, 1 = `*\/*`. Higher wins a q-value tie. */
  specificity: number;
  order: number;
}

function parseQuality(parameter: string): number | null {
  const separator = parameter.indexOf("=");
  if (separator === -1) return null;
  if (parameter.slice(0, separator).trim().toLowerCase() !== "q") return null;
  const parsed = Number.parseFloat(parameter.slice(separator + 1).trim());
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, 0), 1);
}

export function parseAcceptHeader(header: string): AcceptEntry[] {
  const entries: AcceptEntry[] = [];

  for (const [order, part] of header.split(",").entries()) {
    const parameters = part.split(";");
    const mediaType = (parameters[0] ?? "").trim().toLowerCase();
    const slash = mediaType.indexOf("/");
    if (slash <= 0 || slash === mediaType.length - 1) continue;

    let quality = 1;
    for (const parameter of parameters.slice(1)) {
      const parsed = parseQuality(parameter);
      if (parsed !== null) quality = parsed;
    }

    entries.push({
      order,
      quality,
      subtype: mediaType.slice(slash + 1),
      type: mediaType.slice(0, slash),
    });
  }

  return entries;
}

/**
 * The entry that governs a media type is the *most specific* one that matches
 * it, not the highest-q one: `Accept: *\/*, text/markdown;q=0` means "anything
 * except markdown", so the targeted `q=0` has to win over the wildcard.
 */
function matchMediaType(entries: ReadonlyArray<AcceptEntry>, type: string, subtype: string): MediaTypeMatch | null {
  let best: MediaTypeMatch | null = null;

  for (const entry of entries) {
    let specificity = 0;
    if (entry.type === type && entry.subtype === subtype) specificity = 3;
    else if (entry.type === type && entry.subtype === "*") specificity = 2;
    else if (entry.type === "*" && entry.subtype === "*") specificity = 1;
    if (specificity === 0) continue;

    if (!best || specificity > best.specificity) {
      best = { order: entry.order, quality: entry.quality, specificity };
    }
  }

  return best;
}

/** Ranks two matches the way the header does: q-value, then specificity, then order. */
function isStrongerMatch(candidate: MediaTypeMatch, incumbent: MediaTypeMatch): boolean {
  if (candidate.quality !== incumbent.quality) return candidate.quality > incumbent.quality;
  if (candidate.specificity !== incumbent.specificity) return candidate.specificity > incumbent.specificity;
  return candidate.order < incumbent.order;
}

function bestMarkdownMatch(entries: ReadonlyArray<AcceptEntry>): MediaTypeMatch | null {
  let best: MediaTypeMatch | null = null;

  for (const [type, subtype] of MARKDOWN_MEDIA_TYPES) {
    const match = matchMediaType(entries, type, subtype);
    if (!match) continue;
    if (!best || isStrongerMatch(match, best)) best = match;
  }

  return best;
}

/**
 * True when the client ranks markdown above HTML. A missing, blank, or purely
 * wildcard `Accept` means "no constraint", which resolves to the default
 * representation (HTML), never markdown.
 */
export function prefersMarkdown(header: string | null | undefined): boolean {
  if (!header || !header.trim()) return false;

  const entries = parseAcceptHeader(header);
  const markdown = bestMarkdownMatch(entries);
  if (!markdown || markdown.quality === 0) return false;

  const html = matchMediaType(entries, "text", "html");
  if (!html || html.quality === 0) return true;

  if (markdown.quality !== html.quality) return markdown.quality > html.quality;
  if (markdown.specificity !== html.specificity) return markdown.specificity > html.specificity;
  // Equal q and equal specificity: honour the order the client listed them in.
  return markdown.order < html.order;
}

/**
 * True when the client named `text/html` explicitly (and did not reject it),
 * which is what every browser does and what a bare `*\/*` client does not.
 * Used to decide who gets the rendered 404 page and who gets a markdown one.
 */
export function prefersHtml(header: string | null | undefined): boolean {
  if (!header || !header.trim()) return false;
  const match = matchMediaType(parseAcceptHeader(header), "text", "html");
  return match !== null && match.specificity === 3 && match.quality > 0;
}

/** HTML pages whose markdown twin lives at `<path>.md`. */
const NEGOTIABLE_PAGES: ReadonlySet<string> = new Set([
  "/about",
  "/contact",
  "/developers",
  "/education",
  "/privacy",
  "/resume",
  "/skills",
  "/work",
  "/writing",
]);

/** Sections whose `/<section>/<slug>` entry pages each have a `.md` twin. */
const NEGOTIABLE_SECTIONS: ReadonlyArray<string> = ["work", "writing"];

/**
 * The markdown representation of an HTML page path, or null when the path has
 * none (auth pages, API routes, the `.md` and `.txt` files themselves).
 */
export function markdownPathFor(pathname: string): string | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (path === "" || path === "/") return "/index.md";
  if (NEGOTIABLE_PAGES.has(path)) return `${path}.md`;

  const segments = path.split("/");
  if (segments.length === 3 && segments[1] && segments[2] && NEGOTIABLE_SECTIONS.includes(segments[1])) {
    return `${path}.md`;
  }

  return null;
}
