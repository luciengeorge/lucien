import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "#/components/ui/attachment";
import { MessageCancel01Icon, MessageDone01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatContactCard({ status }: { status: "failed" | "sent" }) {
  const isSent = status === "sent";

  return (
    <Attachment className="w-full sm:max-w-md" state={isSent ? "done" : "error"}>
      <AttachmentMedia>
        <HugeiconsIcon icon={isSent ? MessageDone01Icon : MessageCancel01Icon} />
      </AttachmentMedia>

      <AttachmentContent>
        <AttachmentTitle>{isSent ? "Message sent to Lucien" : "Couldn't reach Lucien right now"}</AttachmentTitle>
        <AttachmentDescription>
          {isSent ? "He'll get back to you soon." : "Please try again later."}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}
