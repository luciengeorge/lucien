import { buttonVariants } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useFileDownload } from "#/hooks/use-file-download";
import { cn } from "#/lib/utils";
import { Download01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

const RESUME_URL = "/api/resume/pdf";
const RESUME_FILENAME = "lucien-george-resume.pdf";

/**
 * Downloads Lucien's resume PDF (server-rendered at /api/resume/pdf).
 * Shared across /resume and the work pages.
 */
export function DownloadCvButton({
  className,
  size = "sm",
  variant = "outline",
  label = "Download CV",
}: {
  className?: string;
  size?: "default" | "sm";
  variant?: "default" | "outline";
  label?: string;
}) {
  const { isDownloading, onClick, showSpinner } = useFileDownload(RESUME_URL, RESUME_FILENAME);
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <a
      aria-disabled={isDownloading || undefined}
      className={cn(
        buttonVariants({ size, variant }),
        "shrink-0 rounded-full aria-disabled:cursor-wait aria-disabled:opacity-60 print:hidden",
        className,
      )}
      download={RESUME_FILENAME}
      href={RESUME_URL}
      onClick={(event) => void onClick(event)}
      rel="noreferrer"
      target="_blank"
    >
      {showSpinner ? (
        <Spinner className={size === "sm" ? "size-3.5" : "size-4"} />
      ) : (
        <HugeiconsIcon icon={Download01Icon} size={iconSize} />
      )}
      {label}
    </a>
  );
}
