import { cn } from "#/lib/utils";

/**
 * The one filled control on the site.
 *
 * Everything else here is a rule and a label, so a solid ink block reads as
 * the single most actionable thing on the page - which, on the resume, it is.
 */
export function DownloadResumeLink({ className }: { className?: string }) {
  return (
    <a
      className={cn(
        "group inline-flex h-11 shrink-0 items-center gap-2 self-start bg-ink px-6 font-mono text-[11px] font-semibold tracking-[0.22em] text-paper transition-colors hover:bg-stamp print:hidden",
        className,
      )}
      download="lucien-george-resume.pdf"
      href="/api/resume/pdf"
      rel="noreferrer"
      target="_blank"
    >
      DOWNLOAD PDF
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-y-0.5">
        ↓
      </span>
    </a>
  );
}
