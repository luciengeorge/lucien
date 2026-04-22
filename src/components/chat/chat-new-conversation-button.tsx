import { Button } from "../ui/button";

export function ChatNewConversationButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl justify-end px-4 sm:px-6">
      <Button variant="link" type="button" onClick={onClick}>
        New conversation
      </Button>
    </div>
  );
}
