import { cn } from "#/lib/utils";

/**
 * The attribution line above a turn. Poof answers for Lucien, so his replies
 * carry a small cedar mark; the visitor's own turns are simply what they asked.
 */
export function ChatTurnLabel({ role }: { role: "assistant" | "user" }) {
  const isAssistant = role === "assistant";

  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[11px] tracking-[0.3em]",
        isAssistant ? "text-label" : "text-cedar",
      )}
    >
      {isAssistant ? <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-cedar" /> : null}
      {isAssistant ? "POOF · IN HIS OWN WORDS" : "YOU ASKED"}
    </p>
  );
}
