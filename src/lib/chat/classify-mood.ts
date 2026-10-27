import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";

import type { Mood } from "./mood";

import { MOODS } from "./mood";

/**
 * The cheapest, fastest model in @ai-sdk/openai's list. It runs once per reply, after the words,
 * and the reply's finish waits on it. Asking the chat model for a tag instead was unreliable: it
 * mostly skipped it, and mangled it into visible text when it tried.
 */
export const MOOD_MODEL = "gpt-5.4-nano";
const TIMEOUT_MS = 2000;
const MAX_REPLY_CHARS = 1500;

const SYSTEM = `You set the facial expression of Poof, the assistant on Lucien George's website, to match the reply it just gave a visitor. Pick one mood:
- happy: warm, friendly, glad to help
- excited: genuinely enthusiastic, big news, something Lucien loves
- curious: intrigued by the visitor's question, or mainly asking them about themselves
- thoughtful: reflective, nuanced, weighing things up
- surprised: an unexpected fact or question
- proud: Lucien's achievements, things he built or won
- sheepish: the reply admits it does not know, or turns the request down as not about Lucien
- neutral: plain information, or nothing above fits
Sheepish wins whenever it applies, even when the reply goes on to offer help or ask a question.`;

/**
 * How the finished reply feels, for Poof's face. Null when the model fails or is too slow: the
 * face just stays as it is, and the reply is never held up longer than the timeout.
 */
export async function classifyMood({
  question,
  reply,
  signal,
}: {
  question: string;
  reply: string;
  signal?: AbortSignal;
}): Promise<Mood | null> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  try {
    const { output } = await generateText({
      abortSignal: signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal,
      maxRetries: 0,
      model: openai(MOOD_MODEL),
      output: Output.choice({ options: [...MOODS] }),
      prompt: `Visitor: ${question.slice(0, MAX_REPLY_CHARS)}\n\nPoof: ${reply.slice(0, MAX_REPLY_CHARS)}`,
      providerOptions: { openai: { reasoningEffort: "none" } },
      system: SYSTEM,
    });
    return output;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
