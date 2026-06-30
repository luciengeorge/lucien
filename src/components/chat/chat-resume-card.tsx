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
import { Download01Icon, File01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatResumeCard({ filename, url }: { filename: string; url: string }) {
  const { capture } = useAnalytics();

  return (
    <Attachment className="w-full sm:max-w-md">
      <AttachmentMedia>
        <HugeiconsIcon icon={File01Icon} />
      </AttachmentMedia>

      <AttachmentContent>
        <AttachmentTitle>{filename}</AttachmentTitle>
        <AttachmentDescription>PDF · Resume</AttachmentDescription>
      </AttachmentContent>

      <AttachmentActions>
        <AttachmentAction
          size="sm"
          variant="default"
          className="rounded-full"
          nativeButton={false}
          render={
            <a
              aria-label={`Download ${filename}`}
              download={filename}
              href={url}
              onClick={() => {
                capture(AnalyticsEvent.resumeDownloaded, { filename, source: "resume_card" });
              }}
              rel="noreferrer"
              target="_blank"
            />
          }
        >
          <HugeiconsIcon icon={Download01Icon} />
          Download
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
