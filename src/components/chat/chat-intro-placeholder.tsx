import { ChatStatusMarker } from "./chat-status-marker";
import { ChatTurnLabel } from "./chat-turn-label";
import { entryItemClassName } from "./chat.utils";

export function ChatIntroPlaceholder() {
  return (
    <div className={entryItemClassName(true)}>
      <div className="space-y-4">
        <ChatTurnLabel role="assistant" />
        <ChatStatusMarker label="Preparing Lucien's introduction…" />
      </div>
    </div>
  );
}
