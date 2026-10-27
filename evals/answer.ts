import type { Mood } from "../src/lib/chat/mood";
import type { JudgeVerdict } from "./types";

import { createMoodTagFilter, stripMoodTags } from "../src/lib/chat/mood";

/** What the judge grades: the reply as a visitor reads it, without the mood tag the face takes. */
export function gradedAnswer(text: string): string {
  return stripMoodTags(text);
}

/** The mood a reply opens with, read by the same filter the chat route streams through. Null when untagged. */
export function replyMood(text: string): Mood | null {
  return createMoodTagFilter().push(text).mood ?? null;
}

/** A case passes on a good enough score, and only if the reply opened with a valid mood tag. */
export function passes(verdict: JudgeVerdict | { error: string }, mood: Mood | null): boolean {
  return "score" in verdict && verdict.score >= 0.85 && mood !== null;
}
