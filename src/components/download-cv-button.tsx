import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { Download01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Downloads Lucien's resume PDF (server-rendered at /api/resume/pdf).
 * Shared across /resume and the work pages.
 */
export function DownloadCvButton({
  className,
  size = "sm",
  label = "Download CV",
}: {
  className?: string;
  size?: "default" | "sm";
  label?: string;
}) {
  return (
    <a
      className={cn(buttonVariants({ size, variant: "outline" }), "shrink-0 rounded-full print:hidden", className)}
      download="lucien-george-resume.pdf"
      href="/api/resume/pdf"
      rel="noreferrer"
      target="_blank"
    >
      <HugeiconsIcon icon={Download01Icon} size={size === "sm" ? 14 : 16} />
      {label}
    </a>
  );
}
