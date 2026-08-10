import { ChatStatusMarker } from "./chat-status-marker";
import { ChatTurnLabel } from "./chat-turn-label";
import { entryItemClassName } from "./chat.utils";

export function ChatIntroPlaceholder() {
  return (
    <div className={entryItemClassName(true)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-11">
        <div className="shrink-0 pt-1 sm:w-[120px]">
          <ChatTurnLabel isWriting role="assistant" />
        </div>
        <div className="min-w-0 flex-1">
          <ChatStatusMarker label="Opening the ledger…" />
        </div>
      </div>
    </div>
  );
}
