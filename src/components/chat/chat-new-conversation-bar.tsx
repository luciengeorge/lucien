import { PlusSignIcon } from "@hugeicons-pro/core-solid-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSpinDelay } from "spin-delay";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

export function ChatNewConversationBar({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  const isLoading = useSpinDelay(isDisabled, {
    delay: 250,
    minDuration: 200,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-end px-4 sm:px-6">
      <Button variant="link" type="button" onClick={onClick} disabled={isDisabled}>
        {isLoading ? <Spinner /> : <HugeiconsIcon icon={PlusSignIcon} />}
        New
      </Button>
    </div>
  );
}
