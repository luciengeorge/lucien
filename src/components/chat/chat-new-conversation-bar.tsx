import { useSpinDelay } from "spin-delay";

export function ChatNewConversationBar({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  const isLoading = useSpinDelay(isDisabled, {
    delay: 250,
    minDuration: 200,
  });

  return (
    <div className="flex items-center justify-end">
      <button
        className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-label transition-colors hover:text-ink focus-visible:text-ink disabled:opacity-40"
        disabled={isDisabled}
        onClick={onClick}
        type="button"
      >
        {isLoading ? "STARTING…" : "NEW CONVERSATION"}
        <span aria-hidden className="transition-transform duration-300 group-hover:rotate-180">
          ↺
        </span>
      </button>
    </div>
  );
}
