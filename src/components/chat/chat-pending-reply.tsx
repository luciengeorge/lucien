import { ChatStatusMarker } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";

export function ChatPendingReply({ isFirst }: { isFirst: boolean }) {
  return (
    <div className={entryItemClassName(isFirst)}>
      <div className="space-y-4">
        <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>
        <ChatStatusMarker label="Thinking…" />
      </div>
    </div>
  );
}
