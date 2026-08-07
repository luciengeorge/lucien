import { cn } from "#/lib/utils";

/**
 * The CV, offered the way the journal offers anything: a ruled label and a
 * rust arrow, not a button. Matches the treatment on /resume.
 */
export function DownloadCvLink({ className }: { className?: string }) {
  return (
    <a
      className={cn("group inline-flex items-center gap-2 self-start print:hidden", className)}
      download="lucien-george-resume.pdf"
      href="/api/resume/pdf"
      rel="noreferrer"
      target="_blank"
    >
      <span className="border-b border-ink pb-0.5 font-mono text-[11px] tracking-[0.14em] text-ink">DOWNLOAD CV</span>
      <span aria-hidden className="text-rust transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </a>
  );
}
