import { ChatShimmerLine } from "./chat-shimmer-line";
import { entryItemClassName } from "./chat.utils";

export function ChatIntroPlaceholder() {
  return (
    <li className={entryItemClassName(true)}>
      <div className="space-y-4">
        <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>

        <div className="space-y-2 border-l border-neutral-950/8 pl-4">
          <p className="font-mono text-sm tracking-wide text-neutral-400 uppercase">Thinking</p>
          <p className="max-w-[62ch] text-sm text-pretty text-neutral-500 italic">
            Preparing Lucien&apos;s introduction
          </p>
        </div>

        <div className="space-y-3">
          <ChatShimmerLine widthClassName="w-full" />
          <ChatShimmerLine widthClassName="w-11/12" />
          <ChatShimmerLine widthClassName="w-4/5" />
        </div>
      </div>
    </li>
  );
}
