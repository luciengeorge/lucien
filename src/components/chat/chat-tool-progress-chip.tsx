import { Attachment, AttachmentContent, AttachmentMedia, AttachmentTitle } from "#/components/ui/attachment";
import { Spinner } from "#/components/ui/spinner";

/** A small pill shown while a tool call is running (or its result is being held for reveal). */
export function ChatToolProgressChip({ label }: { label: string }) {
  return (
    <Attachment size="xs" state="processing" className="w-fit">
      <AttachmentMedia>
        <Spinner />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{label}</AttachmentTitle>
      </AttachmentContent>
    </Attachment>
  );
}
