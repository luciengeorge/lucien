/**
 * How Poof feels about what it is saying. The text chat's model opens each reply with a
 * `<mood>NAME</mood>` tag and the voice agent calls `set_mood`; either way the face reacts.
 * Free of Convex imports, so the app and the voice transcript webhook share it.
 */
export const MOODS = [
  "neutral",
  "happy",
  "excited",
  "curious",
  "thoughtful",
  "surprised",
  "proud",
  "sheepish",
] as const;

export type Mood = (typeof MOODS)[number];

const isMood = (value: string): value is Mood => MOODS.some((mood) => mood === value);

export function parseMood(value: unknown): Mood | null {
  if (typeof value !== "string") return null;
  const name = value.trim().toLowerCase();
  return isMood(name) ? name : null;
}

/** The mood in a `{ mood }` object: a reply's message metadata, or a `set_mood` call's parameters. */
export function moodOf(value: unknown): Mood | null {
  return typeof value === "object" && value !== null && "mood" in value ? parseMood(value.mood) : null;
}

const OPEN = "<mood>";
const CLOSE = "</mood>";
const MAX_INNER = 24;

type Scan = { kind: "none" } | { kind: "partial" } | { kind: "tag"; length: number; value: string };

/** Reads `text`, which starts with `<`, as a mood tag, the start of one, or neither. */
function scanTag(text: string): Scan {
  const lower = text.toLowerCase();
  if (lower.length < OPEN.length) return OPEN.startsWith(lower) ? { kind: "partial" } : { kind: "none" };
  if (!lower.startsWith(OPEN)) return { kind: "none" };
  const end = lower.indexOf(CLOSE, OPEN.length);
  if (end === -1) {
    const rest = lower.slice(OPEN.length);
    return rest.length <= MAX_INNER + CLOSE.length && /^[a-z\s]*(<\/?[a-z]*)?$/.test(rest)
      ? { kind: "partial" }
      : { kind: "none" };
  }
  const value = text.slice(OPEN.length, end);
  return value.length <= MAX_INNER && /^[a-z\s]*$/i.test(value)
    ? { kind: "tag", length: end + CLOSE.length, value }
    : { kind: "none" };
}

export type MoodTagFilter = {
  /** Text that cannot be part of a tag comes straight back; a possible tag is held until it resolves. */
  push: (chunk: string) => { mood?: Mood; text: string };
  /** Whatever was held back at the end, which never became a tag. */
  flush: () => string;
};

/**
 * Strips mood tags from a reply as it streams. Only a tag before any words counts; one later on is
 * dropped and ignored, as is a tag naming no known mood. Whitespace before the first words goes too,
 * so a reply never opens on the blank line the model leaves after its tag.
 */
export function createMoodTagFilter(): MoodTagFilter {
  let held = "";
  let started = false;

  const emit = (text: string) => {
    const out = started ? text : text.trimStart();
    if (out) started = true;
    return out;
  };

  return {
    push(chunk) {
      let rest = held + chunk;
      held = "";
      let text = "";
      let mood: Mood | undefined;
      while (rest) {
        const at = rest.indexOf("<");
        if (at === -1) {
          text += emit(rest);
          break;
        }
        text += emit(rest.slice(0, at));
        rest = rest.slice(at);
        const scan = scanTag(rest);
        if (scan.kind === "partial") {
          held = rest;
          break;
        }
        if (scan.kind === "none") {
          text += emit("<");
          rest = rest.slice(1);
          continue;
        }
        if (!started) mood = parseMood(scan.value) ?? undefined;
        rest = rest.slice(scan.length);
      }
      return mood ? { mood, text } : { text };
    },
    flush() {
      const rest = held;
      held = "";
      return emit(rest);
    },
  };
}

/** The same cleaning for a finished text: what gets saved, and what the evals grade. */
export function stripMoodTags(text: string): string {
  const filter = createMoodTagFilter();
  return filter.push(text).text + filter.flush();
}
