import { ChatStatusMarker } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";
import { PoofMark } from "./poof-mark";

export function ChatPendingReply({ isFirst }: { isFirst: boolean }) {
  return (
    <div className={entryItemClassName(isFirst)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <PoofMark state="thinking" />
          <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>
        </div>
        <ChatStatusMarker label="Thinking…" />
      </div>
    </div>
  );
}
