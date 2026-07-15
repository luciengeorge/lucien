import { Attachment, AttachmentContent, AttachmentMedia, AttachmentTitle } from "#/components/ui/attachment";
import { ShimmeringText } from "#/components/ui/shimmering-text";
import { Spinner } from "#/components/ui/spinner";

/** A small pill shown while a tool call is running (or its result is being held for reveal). */
export function ChatToolProgressChip({ label }: { label: string }) {
  return (
    <Attachment size="xs" state="processing" className="w-fit">
      <AttachmentMedia>
        <Spinner />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>
          <ShimmeringText duration={1.8} startOnView={false} text={label} />
        </AttachmentTitle>
      </AttachmentContent>
    </Attachment>
  );
}
