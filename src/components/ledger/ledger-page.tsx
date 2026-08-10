import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

import { Reveal } from "../motion-primitives/reveal";

/**
 * A Ledger page: one wide column of entries with a narrow rail beside it.
 *
 * The rail is where the running account lives - the figures, the route, the
 * machine-readable copies - so the main column never has to stop and list
 * facts mid-sentence. It is a real `aside`, which puts it in the landmark map
 * rather than leaving it as a second unlabelled column.
 */
interface LedgerPageProps {
  children: ReactNode;
  rail?: ReactNode;
}

export function LedgerPage({ children, rail }: LedgerPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-6 pt-10 pb-16 sm:px-10 sm:pt-14 lg:px-14">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-[7.5rem]">
        <div className="flex min-w-0 flex-1 flex-col gap-12 sm:gap-14">{children}</div>
        {rail ? (
          <aside className="flex w-full flex-col gap-8 border-t rule-hair pt-8 lg:w-[260px] lg:shrink-0 lg:border-t-0 lg:pt-2">
            {rail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The page opening: a tracked section label, the title, then whatever the page
 * wants underneath it.
 *
 * The label is deliberately a `p`. It reads as a heading and is sized like
 * one, but promoting it would put two headings at the top of every page and
 * leave the outline saying "WORK" where the page is about where Lucien has
 * worked.
 */
interface PageHeaderProps {
  children?: ReactNode;
  /** The small tracked line above the title, naming the section. */
  label: string;
  title: string;
}

export function PageHeader({ children, label, title }: PageHeaderProps) {
  return (
    <Reveal className="flex flex-col gap-4">
      <p className="font-mono text-[11px] tracking-[0.3em] text-label">{label}</p>
      <h1 className="text-[2rem] leading-[1.15] tracking-[-0.02em] text-ink sm:text-[2.5rem]">{title}</h1>
      {children}
    </Reveal>
  );
}

/** A block opened by an ink rule and titled with a tracked label. */
interface SectionProps {
  children: ReactNode;
  className?: string;
  title: string;
}

export function Section({ children, className, title }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-0", className)}>
      <Reveal className="pb-3">
        <h2 className="font-mono text-[11px] font-normal tracking-[0.3em] text-label">{title}</h2>
      </Reveal>
      <div className="border-t rule-ink" />
      {children}
    </section>
  );
}

/** A labelled block of prose in the rail. */
export function RailNote({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <Reveal className="flex flex-col gap-2.5">
      {label ? <p className="font-mono text-[11px] tracking-[0.3em] text-label">{label}</p> : null}
      <div className="font-sans text-sm/relaxed text-ink-soft">{children}</div>
    </Reveal>
  );
}

/** A rail note set apart by a hairline above it, for the closing remark. */
export function RailAside({ children }: { children: ReactNode }) {
  return (
    <Reveal className="flex flex-col gap-3 border-t rule-hair pt-4">
      <p className="font-sans text-sm/relaxed text-ink-soft">{children}</p>
    </Reveal>
  );
}
