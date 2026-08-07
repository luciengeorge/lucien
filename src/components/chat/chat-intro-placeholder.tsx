import { ChatFieldNoteLabel } from "./chat-field-note-label";
import { ChatStatusMarker } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";

export function ChatIntroPlaceholder() {
  return (
    <div className={entryItemClassName(true)}>
      <div className="space-y-4">
        <ChatFieldNoteLabel role="assistant" />
        <ChatStatusMarker label="Preparing Lucien's introduction…" />
      </div>
    </div>
  );
}
