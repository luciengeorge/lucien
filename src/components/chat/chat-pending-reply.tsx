import { ChatFieldNoteLabel } from "./chat-field-note-label";
import { ChatStatusMarker } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";

export function ChatPendingReply({ isFirst }: { isFirst: boolean }) {
  return (
    <div className={entryItemClassName(isFirst)}>
      <div className="space-y-4">
        <ChatFieldNoteLabel role="assistant" />
        <ChatStatusMarker label="Thinking…" />
      </div>
    </div>
  );
}
