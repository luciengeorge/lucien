import { ChatStatusMarker } from "./chat-status-marker";
import { ChatTurnLabel } from "./chat-turn-label";
import { entryItemClassName } from "./chat.utils";

export function ChatPendingReply({ isFirst }: { isFirst: boolean }) {
  return (
    <div className={entryItemClassName(isFirst)}>
      <div className="space-y-4">
        <ChatTurnLabel role="assistant" />
        <ChatStatusMarker label="Thinking…" />
      </div>
    </div>
  );
}
