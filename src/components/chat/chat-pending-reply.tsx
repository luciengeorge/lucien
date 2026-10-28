import { PoofStatus } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";
import { PoofMark } from "./poof-mark";

export function ChatPendingReply({ isFirst }: { isFirst: boolean }) {
  return (
    <div className={entryItemClassName(isFirst)}>
      <div className="flex items-center">
        <PoofMark state="thinking" />
        <PoofStatus label="Thinking…" />
      </div>
    </div>
  );
}
