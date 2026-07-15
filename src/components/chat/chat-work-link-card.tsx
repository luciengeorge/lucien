import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "#/components/ui/attachment";
import { ArrowRight01Icon, Link04Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatWorkLinkCard({ company, role, url }: { company: string; role: string; url: string }) {
  return (
    <Attachment className="w-full sm:max-w-md">
      <AttachmentMedia>
        <HugeiconsIcon icon={Link04Icon} />
      </AttachmentMedia>

      <AttachmentContent>
        <AttachmentTitle>{company}</AttachmentTitle>
        <AttachmentDescription>{role}</AttachmentDescription>
      </AttachmentContent>

      <AttachmentActions>
        <AttachmentAction
          size="sm"
          variant="default"
          className="rounded-full"
          nativeButton={false}
          render={<a aria-label={`View ${company} case study`} href={url} />}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} />
          View
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
