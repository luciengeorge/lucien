const AUDIO_TAG = /\[(?=[a-z])[a-z][a-z -]{0,28}[a-z]?\](?!\()/g;
const SPOKEN_LUCIEN = /\bLucian(s?)\b/gi;

/**
 * Removes ElevenLabs expressive audio tags like "[thoughtful]" from an agent turn: the voice
 * skips them, but they land in the transcript. Brackets that are not tags, such as "[1]",
 * "[UK]" or a markdown link's text, stay.
 */
export function stripAudioTags(text: string): string {
  const stripped = text.replace(AUDIO_TAG, "");
  if (stripped === text) return text;
  return stripped
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .trim();
}

/** Speech-to-text often writes the visitor's "Lucien" as "Lucian". Case is kept. */
export function correctSpokenNames(text: string): string {
  return text.replace(SPOKEN_LUCIEN, (word) => word.replace(/a/i, (letter) => (letter === "a" ? "e" : "E")));
}

/** A voice turn as the chat should show and store it: `role` is the agent's or the visitor's side. */
export function cleanVoiceText(text: string, role: "agent" | "assistant" | "user"): string {
  return role === "user" ? correctSpokenNames(text) : stripAudioTags(text);
}
