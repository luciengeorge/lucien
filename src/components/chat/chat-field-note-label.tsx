import { cn } from "#/lib/utils";

/**
 * The attribution line above a turn. Poof's replies are field notes, so they
 * carry a rust specimen dot; the visitor's own turns are questions in pen.
 */
export function ChatFieldNoteLabel({ role }: { role: "assistant" | "user" }) {
  const isAssistant = role === "assistant";

  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[11px] tracking-[0.3em] not-italic",
        isAssistant ? "text-label" : "text-pen",
      )}
    >
      {isAssistant ? <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-rust" /> : null}
      {isAssistant ? "POOF · FIELD NOTE" : "YOUR QUESTION"}
    </p>
  );
}
