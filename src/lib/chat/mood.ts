/**
 * How Poof feels about what it is saying. The voice agent calls `set_mood`; for the text chat,
 * the route classifies each finished reply. Either way the face reacts.
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
