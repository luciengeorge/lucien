import { cn } from "#/lib/utils";

import type { ChatMessage } from "./chat.types";

import { INTRO_PROMPT } from "./chat.constants";

export function entryItemClassName(isFirst: boolean) {
  return cn("py-6 sm:py-8", !isFirst && "border-t border-neutral-950/8");
}

export function isBootstrapMessage(message: ChatMessage) {
  if (message.role !== "user") return false;

  return message.parts.some((part) => part.type === "text" && part.text === INTRO_PROMPT);
}
