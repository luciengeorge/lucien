import { Button } from "#/components/ui/button";
import { RefreshIcon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

import { PoofMark } from "./poof-mark";

export function ChatSendFailed({
  onRetry,
  withPoof = false,
}: {
  onRetry: () => void;
  /** Only when no answer is on screen: otherwise the latest answer already carries the face. */
  withPoof?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-4 text-sm text-neutral-600" role="status">
      {withPoof ? <PoofMark className="mr-0 size-10" state="confused" /> : null}
      <span>That didn&apos;t go through. It might be a connection blip.</span>
      <Button className="h-8 rounded-full px-3 text-xs" onClick={onRetry} size="sm" type="button" variant="outline">
        <HugeiconsIcon icon={RefreshIcon} size={14} />
        Try again
      </Button>
    </div>
  );
}
