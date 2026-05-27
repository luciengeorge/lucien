import { buttonVariants } from "#/components/ui/button";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { cn } from "#/lib/utils";
import { Download01Icon, File01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatResumeCard({ filename, url }: { filename: string; url: string }) {
  const { capture } = useAnalytics();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-950/10 bg-neutral-950/2 px-4 py-3 sm:max-w-md">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950/5 text-neutral-700">
        <HugeiconsIcon icon={File01Icon} size={20} />
      </div>

      <div className="min-w-0 grow">
        <p className="truncate text-sm font-medium text-neutral-950">{filename}</p>
        <p className="font-mono text-xs tracking-wide text-neutral-500 uppercase">PDF · Resume</p>
      </div>

      <a
        className={cn(buttonVariants({ size: "sm", variant: "default" }), "shrink-0 rounded-full")}
        download={filename}
        href={url}
        onClick={() => {
          capture(AnalyticsEvent.resumeDownloaded, { filename, source: "resume_card" });
        }}
        rel="noreferrer"
        target="_blank"
      >
        <HugeiconsIcon icon={Download01Icon} size={16} />
        Download
      </a>
    </div>
  );
}
