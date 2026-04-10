import { ChatShimmerLine } from "./chat-shimmer-line";
import { entryItemClassName } from "./chat.utils";

export function ChatPendingReply({ isFirst }: { isFirst: boolean }) {
  return (
    <li className={entryItemClassName(isFirst)}>
      <div className="space-y-4">
        <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>

        <div className="space-y-2 border-l border-neutral-950/8 pl-4">
          <p className="font-mono text-sm tracking-wide text-neutral-400 uppercase">Thinking</p>
          <p className="max-w-[62ch] text-sm text-pretty text-neutral-500 italic">Drafting a reply</p>
        </div>

        <div className="space-y-3">
          <ChatShimmerLine widthClassName="w-full" />
          <ChatShimmerLine widthClassName="w-10/12" />
        </div>
      </div>
    </li>
  );
}
