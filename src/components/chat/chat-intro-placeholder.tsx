import { AnimatePresence } from "motion/react";

import { PoofStatus } from "./chat-status-marker";
import { entryItemClassName } from "./chat.utils";
import { PoofMark } from "./poof-mark";

/** `withPoof` is off when a queued message's pending reply is already showing a thinking face. */
export function ChatIntroPlaceholder({ withPoof }: { withPoof: boolean }) {
  return (
    <div className={entryItemClassName(true)}>
      <div className="flex items-center">
        <AnimatePresence>{withPoof ? <PoofMark key="poof" state="thinking" /> : null}</AnimatePresence>
        <PoofStatus label="Preparing Lucien's introduction…" />
      </div>
    </div>
  );
}
