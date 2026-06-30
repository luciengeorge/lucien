import { ChatStatusMarker } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";

export function ChatIntroPlaceholder() {
  return (
    <div className={entryItemClassName(true)}>
      <div className="space-y-4">
        <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>
        <ChatStatusMarker label="Preparing Lucien's introduction…" />
      </div>
    </div>
  );
}
