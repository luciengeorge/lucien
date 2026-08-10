/**
 * The label lane beside a turn: who is speaking, and whether they are still
 * speaking.
 *
 * Turns are deliberately not numbered. A ledger numbers its lines because you
 * need to cite them; nobody cites a turn in a conversation, so the number
 * carried no information while costing a second line beside every turn and a
 * second thing read aloud on each one.
 *
 * Poof answers as Lucien, so his turns are attributed to him rather than to
 * the assistant.
 */
export function ChatTurnLabel({ isWriting = false, role }: { isWriting?: boolean; role: "assistant" | "user" }) {
  const isAssistant = role === "assistant";

  return (
    <div className="flex flex-col gap-1.5">
      <p className={`font-mono text-[11px] font-semibold tracking-[0.22em] ${isAssistant ? "text-ink" : "text-label"}`}>
        {isAssistant ? "LUCIEN" : "YOU"}
      </p>
      {isWriting ? (
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-stamp">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 animate-pulse rounded-full bg-stamp"
            data-slot="writing-dot"
          />
          WRITING
        </p>
      ) : null}
    </div>
  );
}
