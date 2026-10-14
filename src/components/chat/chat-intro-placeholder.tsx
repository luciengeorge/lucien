import { AnimatePresence } from "motion/react";

import { ChatStatusMarker } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";
import { PoofMark } from "./poof-mark";

/** `withPoof` is off when a queued message's pending reply is already showing a thinking face. */
export function ChatIntroPlaceholder({ withPoof }: { withPoof: boolean }) {
  return (
    <div className={entryItemClassName(true)}>
      <div className="space-y-4">
        <div className="flex items-center">
          <AnimatePresence>{withPoof ? <PoofMark key="poof" state="thinking" /> : null}</AnimatePresence>
          <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>
        </div>
        <ChatStatusMarker label="Preparing Lucien's introduction…" />
      </div>
    </div>
  );
}
