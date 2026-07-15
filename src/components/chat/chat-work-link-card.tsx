import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "#/components/ui/attachment";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { ArrowRight01Icon, Link04Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatWorkLinkCard({
  company,
  role,
  slug,
  url,
}: {
  company: string;
  role: string;
  slug: string;
  url: string;
}) {
  const { capture } = useAnalytics();

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
          render={
            <a
              aria-label={`View ${company} case study`}
              href={url}
              onClick={() => {
                capture(AnalyticsEvent.workLinkClicked, { slug });
              }}
            />
          }
        >
          <HugeiconsIcon icon={ArrowRight01Icon} />
          View
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
