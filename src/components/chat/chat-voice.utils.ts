import type { ChatConversationState } from "#/lib/chat-types";
import type { UIMessage } from "ai";

import { getTextFromMessage, parseSerializedMessages } from "#/lib/chat-types";
import { z } from "zod";

const CONTEXT_TURNS = 20;
const CONTEXT_MAX_CHARS = 4000;
const CONTEXT_HEADER = "Before this call, the visitor chatted with you by text. The chat so far:";

const VoiceMetadataSchema = z.object({ callId: z.string().optional(), channel: z.literal("voice") });

export type ContactPrefill = { contact?: string; message?: string; name?: string };

const prefillField = (max: number) => z.string().trim().max(max).min(1);

/** What `show_contact_form` may carry, held to the form's own limits. A bad field is dropped, not the rest. */
export function contactPrefillOf(parameters: unknown): ContactPrefill {
  const fields = z.object({ contact: z.unknown(), message: z.unknown(), name: z.unknown() }).safeParse(parameters);
  if (!fields.success) return {};
  const keep = (value: unknown, max: number) => {
    const parsed = prefillField(max).safeParse(value);
    return parsed.success ? parsed.data : undefined;
  };
  const prefill: ContactPrefill = {};
  const contact = keep(fields.data.contact, 200);
  const message = keep(fields.data.message, 2000);
  const name = keep(fields.data.name, 120);
  if (contact) prefill.contact = contact;
  if (message) prefill.message = message;
  if (name) prefill.name = name;
  return prefill;
}

export function isVoiceMessage(message: UIMessage): boolean {
  return VoiceMetadataSchema.safeParse(message.metadata).success;
}

function isFromCall(message: UIMessage, callId: string): boolean {
  const metadata = VoiceMetadataSchema.safeParse(message.metadata);
  return metadata.success && metadata.data.callId === callId;
}

/**
 * The typed chat, for the voice agent to pick up from. Null until the visitor has said anything:
 * the intro alone is Poof's own greeting and gives the call nothing to go on.
 */
export function buildVoiceContext(messages: UIMessage[]): string | null {
  if (!messages.some((message) => message.role === "user")) return null;

  const lines = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-CONTEXT_TURNS)
    .flatMap((message) => {
      const words = getTextFromMessage(message);
      return words ? [`${message.role === "user" ? "Visitor" : "Poof"}: ${words}`] : [];
    });

  // Newest first, so the cap drops the oldest turns.
  const kept: string[] = [];
  let length = CONTEXT_HEADER.length;
  for (const line of [...lines].reverse()) {
    const room = CONTEXT_MAX_CHARS - length - 1;
    if (room <= 0) break;
    const fitted = line.slice(0, room);
    kept.unshift(fitted);
    length += fitted.length + 1;
  }
  return [CONTEXT_HEADER, ...kept].join("\n");
}

export function formatCountdown(secs: number): string {
  const whole = Math.max(0, Math.ceil(secs));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * The transcript reaches the chat from ElevenLabs' post-call webhook, a few seconds after hanging
 * up. Refetches the conversation until that call's turns are in it, or gives up after `timeoutMs`
 * with the last copy it got. Aborting resolves with no state, so nothing gets applied.
 */
export async function waitForVoiceTranscript({
  callId,
  fetchConversation,
  intervalMs = 2000,
  signal,
  timeoutMs = 30_000,
}: {
  callId: string;
  /** Null when the read found nothing this time; the wait goes on. */
  fetchConversation: () => Promise<ChatConversationState | null>;
  intervalMs?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<{ found: boolean; state: ChatConversationState | null }> {
  let latest: ChatConversationState | null = null;
  for (let waited = 0; waited <= timeoutMs; waited += intervalMs) {
    if (waited > 0) await new Promise((resolve) => setTimeout(resolve, intervalMs));
    if (signal?.aborted) return { found: false, state: null };
    let found = false;
    try {
      const next = await fetchConversation();
      if (!next) continue;
      found = parseSerializedMessages(next.serializedMessages).some((message) => isFromCall(message, callId));
      latest = next;
    } catch {
      continue;
    }
    if (signal?.aborted) return { found: false, state: null };
    if (found) return { found: true, state: latest };
  }
  return { found: false, state: latest };
}
