import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "#/components/ui/attachment";
import { Spinner } from "#/components/ui/spinner";
import { useFileDownload } from "#/hooks/use-file-download";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { Download01Icon, File01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatResumeCard({ filename, url }: { filename: string; url: string }) {
  const { capture } = useAnalytics();
  const { isDownloading, onClick, showSpinner } = useFileDownload(url, filename);

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
          className="rounded-full aria-disabled:cursor-wait aria-disabled:opacity-60"
          nativeButton={false}
          render={
            <a
              aria-disabled={isDownloading || undefined}
              aria-label={`Download ${filename}`}
              download={filename}
              href={url}
              onClick={(event) => {
                if (!isDownloading) capture(AnalyticsEvent.resumeDownloaded, { filename, source: "resume_card" });
                void onClick(event);
              }}
              rel="noreferrer"
              target="_blank"
            />
          }
        >
          {showSpinner ? <Spinner className="size-3.5" /> : <HugeiconsIcon icon={Download01Icon} />}
          Download
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
