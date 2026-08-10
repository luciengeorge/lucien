import type { WorkEntry } from "#/lib/content/registry";
import type { ReactNode } from "react";

import { CompanyLogo } from "#/components/resume/company-logo";
import { renderMarkdown } from "#/lib/content/markdown";
import { formatWorkPeriod } from "#/lib/content/work-period";
import { Link } from "@tanstack/react-router";

import { Reveal } from "../motion-primitives/reveal";
import { FyxerSequence } from "./illustrations/fyxer-sequence";
import { RailStat, RailStats } from "./leader-row";
import { LedgerPage, RailAside, Section } from "./ledger-page";

interface SheetExtras {
  figure?: { render: () => ReactNode; title: string };
  /** Rail figures, as label/value pairs. Kept short: this is a column, not a table. */
  stats?: Array<{ label: string; value: string }>;
}

/**
 * Per-slug additions to the standard page. Everything an entry does not declare
 * here simply does not appear, so giving another company a figure is a line in
 * this map rather than another branch in the component.
 */
const SHEET_EXTRAS: Record<string, SheetExtras> = {
  fyxer: {
    figure: { render: () => <FyxerSequence />, title: "WHAT HE SHIPPED, IN ORDER" },
    stats: [
      { label: "TEAM", value: "2 people" },
      { label: "WEEKLY ACTIVES", value: "1,000" },
      { label: "CALLS RECORDED", value: "~10,000" },
    ],
  },
};

/**
 * One company. The header names it and reaches across to the dates, the rail
 * carries whatever figures the entry has, and the prose tells what happened.
 *
 * The role is stated once, in the header. It used to appear in both the header
 * and the aside, which read as a template filling itself in rather than a page
 * telling you something.
 */
export function WorkSheet({ entry }: { entry: WorkEntry }) {
  const extras = SHEET_EXTRAS[entry.slug];
  const html = renderMarkdown(entry.source);

  return (
    <LedgerPage
      rail={
        <>
          {extras?.stats ? (
            <RailStats label="ACCOUNT">
              {extras.stats.map((stat) => (
                <RailStat key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </RailStats>
          ) : null}
          <RailAside>Ask the page anything about this one.</RailAside>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Reveal>
          <Link
            className="group inline-flex items-baseline gap-2 font-mono text-[11px] tracking-[0.3em] text-stamp"
            to="/work"
            viewTransition
          >
            <span aria-hidden className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            WORK
          </Link>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          <CompanyLogo
            className="size-10 text-xs"
            color={entry.color}
            company={entry.company}
            logo={entry.logo}
            style={{ viewTransitionName: `work-logo-${entry.slug}` }}
          />
          <h1 className="text-[2rem] leading-[1.15] tracking-[-0.02em] text-ink sm:text-[2.5rem]">{entry.company}</h1>
          <div className="flex max-w-[46rem] flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="shrink-0 font-mono text-[13px] tracking-[0.14em] text-ink-soft uppercase">
              {entry.role}
            </span>
            <span aria-hidden className="hidden leader sm:block" />
            <span className="shrink-0 font-mono text-[13px] font-semibold whitespace-nowrap text-ink">
              {formatWorkPeriod(entry.period)}
            </span>
          </div>
        </Reveal>
      </div>

      <Reveal className="border-t rule-ink pt-8">
        <div
          className="prose max-w-[46rem] font-sans prose-headings:font-mono prose-headings:text-ink prose-p:text-[17px]/relaxed prose-p:text-ink prose-a:text-stamp prose-a:underline prose-a:underline-offset-4 prose-strong:font-semibold prose-strong:text-ink prose-li:text-[17px]/relaxed prose-li:text-ink"
          data-slot="work-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Reveal>

      {extras?.figure ? <Section title={extras.figure.title}>{extras.figure.render()}</Section> : null}
    </LedgerPage>
  );
}
