import { cn } from "#/lib/utils";

/** Entries are numbered like ledger lines: 01, 02, and so on down the transcript. */
export function entryNumeral(index: number): string {
  return `ENTRY ${String(index + 1).padStart(2, "0")}`;
}

/**
 * The label lane beside a turn. Two stacked lines, fixed width, so every turn
 * in the transcript reads down the same two columns: who is speaking, and
 * which entry this is.
 *
 * Poof answers as Lucien, so his turns are attributed to him rather than to
 * the assistant. While a reply is still arriving the entry number gives way to
 * a live marker: the number is only true once the entry is closed.
 */
export function ChatTurnLabel({
  entryIndex,
  isWriting = false,
  role,
}: {
  entryIndex: number;
  isWriting?: boolean;
  role: "assistant" | "user";
}) {
  const isAssistant = role === "assistant";

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={cn(
          "font-mono text-[11px] tracking-[0.22em]",
          isAssistant ? "font-semibold text-ink" : "font-semibold text-label",
        )}
      >
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
      ) : (
        <p className="font-mono text-[11px] tracking-[0.22em] text-label/80">{entryNumeral(entryIndex)}</p>
      )}
    </div>
  );
}
