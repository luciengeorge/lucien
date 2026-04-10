import { cn } from "#/lib/utils";
import { Streamdown } from "streamdown";

import type { ChatMessage, ChatStatus } from "./chat.types";

import { ChatShimmerLine } from "./chat-shimmer-line";
import { entryItemClassName } from "./chat.utils";

export function ChatTimelineMessage({
  isFirst,
  message,
  status,
}: {
  isFirst: boolean;
  message: ChatMessage;
  status: ChatStatus;
}) {
  const role = message.role === "user" ? "user" : "assistant";
  const reasoningParts = message.parts.filter((part) => part.type === "reasoning");
  const textParts = message.parts.filter((part) => part.type === "text");

  return (
    <li className={entryItemClassName(isFirst)}>
      <div className="space-y-4">
        <p
          className={cn(
            "font-mono text-sm tracking-wide uppercase",
            role === "assistant" ? "text-neutral-500" : "text-neutral-400",
          )}
        >
          {role === "user" ? "You" : "Poof"}
        </p>

        {reasoningParts.length > 0 ? (
          <div className="space-y-2 border-l border-neutral-950/8 pl-4">
            <p className="font-mono text-sm tracking-wide text-neutral-400 uppercase">Thinking</p>
            {reasoningParts.map((part) => (
              <p
                key={`${message.id}-reasoning-${part.text}`}
                className="max-w-[62ch] text-sm text-pretty text-neutral-500 italic"
              >
                {part.text}
              </p>
            ))}
          </div>
        ) : null}

        {textParts.length > 0 ? (
          <div
            className={cn(
              "max-w-none [&_p]:max-w-[62ch] [&_p]:text-pretty",
              role === "assistant"
                ? "text-[1.02rem] text-neutral-800 sm:text-[1.08rem]"
                : "text-base font-medium text-neutral-950 sm:text-[1.02rem]",
            )}
          >
            {textParts.map((part) => (
              <Streamdown key={`${message.id}-text-${part.text}`} isAnimating={status === "streaming"}>
                {part.text}
              </Streamdown>
            ))}
          </div>
        ) : role === "assistant" && status === "streaming" ? (
          <div className="space-y-3">
            <ChatShimmerLine widthClassName="w-full" />
            <ChatShimmerLine widthClassName="w-11/12" />
          </div>
        ) : null}
      </div>
    </li>
  );
}
