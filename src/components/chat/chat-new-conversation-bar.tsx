import { useSpinDelay } from "spin-delay";

export function ChatNewConversationBar({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  const isLoading = useSpinDelay(isDisabled, {
    delay: 250,
    minDuration: 200,
  });

  return (
    <div className="flex items-center justify-end">
      <button
        className="font-mono text-[11px] tracking-[0.3em] text-label transition-colors hover:text-pen focus-visible:text-pen disabled:opacity-40"
        disabled={isDisabled}
        onClick={onClick}
        type="button"
      >
        {isLoading ? "STARTING…" : "NEW PAGE"}
      </button>
    </div>
  );
}
