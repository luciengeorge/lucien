import { useSpinDelay } from "spin-delay";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

export function ChatNewConversationButton({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  const isLoading = useSpinDelay(isDisabled, {
    delay: 250,
    minDuration: 200,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl justify-end px-4 sm:px-6">
      <Button variant="link" type="button" onClick={onClick} disabled={isLoading}>
        {isLoading ? <Spinner className="mr-1" /> : null}
        New conversation
      </Button>
    </div>
  );
}
