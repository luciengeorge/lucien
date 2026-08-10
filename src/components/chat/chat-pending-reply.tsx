import { ChatStatusMarker } from "./chat-status-marker";
import { ChatTurnLabel } from "./chat-turn-label";
import { entryItemClassName } from "./chat.utils";

export function ChatPendingReply({ entryIndex, isFirst }: { entryIndex: number; isFirst: boolean }) {
  return (
    <div className={entryItemClassName(isFirst)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-11">
        <div className="shrink-0 pt-1 sm:w-[120px]">
          <ChatTurnLabel entryIndex={entryIndex} isWriting role="assistant" />
        </div>
        <div className="min-w-0 flex-1">
          <ChatStatusMarker label="Thinking…" />
        </div>
      </div>
    </div>
  );
}
