import { Button } from "#/components/ui/button";
import { RefreshIcon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatSendFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-neutral-950/8 py-4 text-sm text-neutral-600"
      role="status"
    >
      <span>That didn&apos;t go through. It might be a connection blip.</span>
      <Button className="h-8 rounded-full px-3 text-xs" onClick={onRetry} size="sm" type="button" variant="outline">
        <HugeiconsIcon icon={RefreshIcon} size={14} />
        Try again
      </Button>
    </div>
  );
}
