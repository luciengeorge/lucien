import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

/**
 * A tool result, filed as a ledger entry rather than boxed as a card.
 *
 * Poof's results are things Lucien has produced - a piece of work, a resume, a
 * message sent - so they belong on the page as ruled line items under a label,
 * the same shape the work index and the rail use. A rounded card with a shadow
 * would read as a widget the answer had been handed, which is the opposite of
 * what it is.
 */
export function ChatLedgerCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex max-w-[46rem] flex-col" data-slot="ledger-card">
      <p className="pb-2.5 font-mono text-[11px] tracking-[0.3em] text-label">{label}</p>
      <div className="border-t rule-hair" />
      <div className="flex flex-col">{children}</div>
      <div className="border-t rule-hair" />
    </div>
  );
}

interface ChatLedgerRowProps {
  action?: ReactNode;
  description?: ReactNode;
  /** The value the title reaches across to. Without one, there is no leader. */
  meta?: ReactNode;
  title: string;
  titleClassName?: string;
}

export function ChatLedgerRow({ action, description, meta, title, titleClassName }: ChatLedgerRowProps) {
  return (
    <div className="flex flex-col gap-1.5 py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <span aria-hidden="true" className="size-1.5 shrink-0 self-center bg-ink" data-slot="row-marker" />
        <span className={cn("shrink-0 font-mono text-[15px] font-semibold tracking-[0.04em] text-ink", titleClassName)}>
          {title}
        </span>
        {meta ? <span aria-hidden className="hidden leader sm:block" /> : null}
        {meta ? <span className="shrink-0 font-mono text-[13px] whitespace-nowrap text-ink-soft">{meta}</span> : null}
        {action}
      </div>
      {description ? <p className="pl-[1.375rem] font-sans text-sm/relaxed text-ink-soft">{description}</p> : null}
    </div>
  );
}
