import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

import { Reveal } from "../field-notes/reveal";
import { CedarMark } from "./cedar-mark";

/**
 * A Cedar page.
 *
 * Keeps the two-column shape, because an aside genuinely helps these pages,
 * but the register changes: stone rules instead of dashed ones, Geist for
 * body copy, and Fraunces reserved for display. The cedar sits behind the
 * first column as a watermark.
 */
interface CedarPageProps {
  children: ReactNode;
  aside?: ReactNode;
}

export function CedarPage({ aside, children }: CedarPageProps) {
  return (
    <div className="relative mx-auto w-full max-w-[1500px] px-6 pt-12 pb-16 sm:px-10 sm:pt-16 lg:px-14">
      <CedarMark className="pointer-events-none absolute top-24 right-4 hidden w-[280px] lg:block" />
      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">
        <div className="flex min-w-0 flex-1 flex-col gap-12 sm:gap-14">{children}</div>
        {aside ? (
          <aside className="flex w-full flex-col gap-8 border-t rule-stone pt-8 lg:w-[280px] lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-2 lg:pl-8">
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The page opening. A small italic lead-in above a large roman title is the
 * direction's signature typographic move, lifted from "made in / the Levant".
 */
interface PageHeaderProps {
  children?: ReactNode;
  /** The small italic cedar-green line above the title. */
  leadIn: string;
  title: string;
}

export function PageHeader({ children, leadIn, title }: PageHeaderProps) {
  return (
    <Reveal className="flex flex-col gap-2">
      <p className="font-display text-2xl leading-none font-light text-cedar italic sm:text-3xl">{leadIn}</p>
      <h1 className="text-5xl leading-[0.92] tracking-[-0.01em] text-ink sm:text-6xl">{title}</h1>
      {children}
    </Reveal>
  );
}

/** A stone-ruled section with a small tracked label. */
interface SectionProps {
  children: ReactNode;
  className?: string;
  title: string;
}

export function Section({ children, className, title }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-6 border-t rule-stone pt-5", className)}>
      <Reveal>
        <h2 className="font-mono text-[11px] font-normal tracking-[0.3em] text-label">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}

/** A labelled aside block. Body is Geist here, not Fraunces. */
export function AsideNote({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <Reveal className="flex flex-col gap-2">
      {label ? <p className="font-mono text-[11px] tracking-[0.18em] text-label">{label}</p> : null}
      <div className="font-sans text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </Reveal>
  );
}

/** The cedar-green voice, used when the aside is speaking rather than labelling. */
export function AsideVoice({ children }: { children: ReactNode }) {
  return <Reveal className="font-display text-lg leading-snug text-cedar italic">{children}</Reveal>;
}
