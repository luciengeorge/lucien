import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

import { Reveal } from "./reveal";

/**
 * The two-column journal page: a main column and a real margin.
 *
 * The margin is the whole point of this direction, so it is a first-class
 * layout slot rather than a sidebar. On narrow screens it drops below the main
 * column and keeps its dashed rule on top instead of the side, so the
 * annotation still reads as an aside and not as more body copy.
 */
interface JournalPageProps {
  children: ReactNode;
  /** Annotations, sketches and asides. Omit for pages that do not need one. */
  margin?: ReactNode;
}

export function JournalPage({ children, margin }: JournalPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-6 pt-12 pb-16 sm:px-10 sm:pt-16 lg:px-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-[88px]">
        <div className="flex min-w-0 flex-1 flex-col gap-12 sm:gap-14">{children}</div>
        {margin ? (
          <aside className="flex w-full flex-col gap-8 border-t rule-dashed pt-8 lg:w-[300px] lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-11 lg:pl-[30px]">
            {margin}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Every page opens the same way: a lowercase mono field-note line, then the
 * title in Fraunces italic. The meta line is what makes the page feel observed
 * rather than authored.
 */
interface PageHeaderProps {
  children?: ReactNode;
  meta: string;
  title: string;
}

export function PageHeader({ children, meta, title }: PageHeaderProps) {
  return (
    <Reveal className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-[0.08em] text-label">{meta}</p>
      <h1 className="text-ink">{title}</h1>
      {children}
    </Reveal>
  );
}

/** A labelled block in the margin: small mono label over an italic note. */
interface MarginNoteProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

export function MarginNote({ children, className, label }: MarginNoteProps) {
  return (
    <Reveal className={cn("flex flex-col gap-2", className)}>
      {label ? <p className="font-mono text-[11px] tracking-[0.14em] text-label">{label}</p> : null}
      <div className="font-display text-base leading-relaxed text-ink italic">{children}</div>
    </Reveal>
  );
}

/** The pen-blue aside voice - used when the margin is speaking, not labelling. */
export function MarginVoice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={cn("font-display text-base leading-relaxed text-pen italic", className)}>{children}</Reveal>
  );
}

/**
 * A dashed-rule section with a tracked mono heading, used for the labelled
 * blocks that run down the main column (BEHAVIOUR IN THE WILD, FIG. 1, and so on).
 */
interface SectionProps {
  children: ReactNode;
  className?: string;
  title: string;
}

export function Section({ children, className, title }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-6 border-t rule-dashed pt-4", className)}>
      <Reveal>
        <h2 className="font-mono text-[11px] font-medium tracking-[0.3em] text-label not-italic">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}
