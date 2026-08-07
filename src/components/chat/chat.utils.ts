import { AnalyticsEvent } from "#/lib/analytics";
import { cn } from "#/lib/utils";

import type { ChatMessage } from "./chat.types";

type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export function entryItemClassName(isFirst: boolean) {
  return cn("py-7 sm:py-9", !isFirst && "border-t rule-stone");
}

/** Tool names (e.g. "download_resume") for every tool part present in a message. */
export function getInvokedToolNames(parts: ChatMessage["parts"]): string[] {
  return parts.flatMap((part) => (part.type.startsWith("tool-") ? [part.type.slice("tool-".length)] : []));
}

function isContactStatus(value: unknown): value is "failed" | "sent" {
  return value === "sent" || value === "failed";
}

/** The contact_lucien tool's resolved status, or undefined if it hasn't resolved (or isn't present). */
export function getContactSubmissionStatus(parts: ChatMessage["parts"]): "failed" | "sent" | undefined {
  for (const part of parts) {
    if (part.type !== "tool-contact_lucien") continue;
    if (!("state" in part) || part.state !== "output-available") continue;
    if (!("output" in part)) continue;

    const output = part.output;
    if (output && typeof output === "object" && "status" in output && isContactStatus(output.status)) {
      return output.status;
    }
  }
  return undefined;
}

/** True when a settled assistant turn rendered nothing: no text, and no tool part. */
export function isEmptyAssistantTurn(parts: ChatMessage["parts"]): boolean {
  const hasText = parts.some((part) => part.type === "text" && "text" in part && part.text.length > 0);
  const hasToolPart = parts.some((part) => part.type.startsWith("tool-"));
  return !hasText && !hasToolPart;
}

export interface SettledAssistantAnalyticsEvent {
  event: AnalyticsEventName;
  properties: Record<string, string>;
}

/**
 * Analytics events to capture once a settled assistant turn is examined: one
 * chat_tool_invoked per tool call, contact_submitted if the contact tool resolved,
 * and chat_response_empty_rendered if nothing rendered for the turn. Never includes
 * message text, only tool names / statuses.
 */
export function getSettledAssistantAnalyticsEvents(parts: ChatMessage["parts"]): SettledAssistantAnalyticsEvent[] {
  const events: SettledAssistantAnalyticsEvent[] = getInvokedToolNames(parts).map((tool) => ({
    event: AnalyticsEvent.chatToolInvoked,
    properties: { tool },
  }));

  const contactStatus = getContactSubmissionStatus(parts);
  if (contactStatus) {
    events.push({ event: AnalyticsEvent.contactSubmitted, properties: { status: contactStatus } });
  }

  if (isEmptyAssistantTurn(parts)) {
    events.push({ event: AnalyticsEvent.chatResponseEmptyRendered, properties: {} });
  }

  return events;
}

/** Wraps a fetch implementation to invoke `onRateLimited` whenever the response is a 429. */
export function createRateLimitAwareFetch(baseFetch: typeof fetch, onRateLimited: () => void): typeof fetch {
  return async (input, init) => {
    const response = await baseFetch(input, init);
    if (response.status === 429) {
      onRateLimited();
    }
    return response;
  };
}
