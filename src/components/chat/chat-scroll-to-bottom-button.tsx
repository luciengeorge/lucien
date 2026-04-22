import { ArrowDown04Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "../ui/button";

export function ChatScrollToBottomButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-14 flex justify-center sm:-top-16">
      <Button
        size="icon"
        variant="outline"
        type="button"
        onClick={onClick}
        className="pointer-events-auto rounded-full border-neutral-950/10 bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/75"
      >
        <span className="sr-only">scroll to bottom</span>
        <span aria-hidden="true">
          <HugeiconsIcon icon={ArrowDown04Icon} />
        </span>
      </Button>
    </div>
  );
}
