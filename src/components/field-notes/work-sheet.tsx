import type { WorkEntry } from "#/lib/content/registry";
import type { ReactNode } from "react";

import { CompanyLogo } from "#/components/resume/company-logo";
import { renderMarkdown } from "#/lib/content/markdown";
import { WORK_META } from "#/lib/content/work-meta";
import { formatWorkPeriod, workPeriodStart } from "#/lib/content/work-period";
import { Link } from "@tanstack/react-router";

import { DownloadCvLink } from "./download-cv-link";
import { FyxerSequence } from "./illustrations/fyxer-sequence";
import { JournalPage, MarginNote, MarginVoice, PageHeader, Section } from "./journal-page";
import { Reveal } from "./reveal";
import { specimenNumeral } from "./work-register";

interface FieldStat {
  label: string;
  value: string;
}

interface SheetExtras {
  figure?: { render: () => ReactNode; title: string };
  stats?: FieldStat[];
}

/**
 * Per-slug additions to the standard sheet. Everything a specimen does not
 * declare here simply does not appear, so giving another entry a figure is a
 * line in this map rather than another branch in the component.
 */
const SHEET_EXTRAS: Record<string, SheetExtras> = {
  fyxer: {
    figure: { render: () => <FyxerSequence />, title: "FIG. 1 · WHAT HE SHIPPED, IN ORDER" },
    stats: [
      { label: "POPULATION", value: "1,000 weekly active users" },
      { label: "RECORDED", value: "~10,000 calls, within months of launch" },
      { label: "OBSERVERS", value: "Two. Lucien and Serafin." },
    ],
  },
};

const TOTAL = specimenNumeral(WORK_META.length - 1);

/**
 * One specimen sheet: the header identifies the record, the prose is the
 * observation, and the margin carries the measurements taken alongside it.
 *
 * Body copy is set in Fraunces rather than the sans the rest of the app uses,
 * so the `prose` defaults are overridden per element: Tailwind Typography sets
 * colour on the container, which would otherwise win over an inherited `text-ink`.
 */
export function WorkSheet({ entry }: { entry: WorkEntry }) {
  const extras = SHEET_EXTRAS[entry.slug];
  const position = WORK_META.findIndex((meta) => meta.slug === entry.slug);
  const html = renderMarkdown(entry.source);

  return (
    <JournalPage
      margin={
        <>
          <MarginNote label="ROLE">{entry.role}</MarginNote>
          <MarginNote label="PERIOD">{formatWorkPeriod(entry.period)}</MarginNote>
          {extras?.stats?.map((stat) => (
            <MarginNote key={stat.label} label={stat.label}>
              {stat.value}
            </MarginNote>
          ))}
          <MarginVoice>Ask the page anything about this one.</MarginVoice>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <Reveal>
          <Link
            className="inline-flex items-baseline gap-2 font-mono text-xs text-label transition-colors hover:text-ink"
            to="/work"
            viewTransition
          >
            <span aria-hidden>←</span>
            back to work
          </Link>
        </Reveal>

        <Reveal>
          <CompanyLogo
            className="size-11 text-xs opacity-90"
            color={entry.color}
            company={entry.company}
            logo={entry.logo}
            style={{ viewTransitionName: `work-logo-${entry.slug}` }}
          />
        </Reveal>

        <PageHeader
          meta={`specimen ${specimenNumeral(position)} of ${TOTAL} · collected ${workPeriodStart(entry.period)}`}
          title={entry.company}
        >
          <p className="font-display text-xl text-pen italic">→ {entry.role}</p>
          <DownloadCvLink className="mt-2" />
        </PageHeader>
      </div>

      <Reveal>
        <div
          className="prose max-w-none font-display prose-headings:font-display prose-headings:text-ink prose-headings:italic prose-p:text-xl/relaxed prose-p:text-ink prose-a:text-pen prose-a:underline prose-a:underline-offset-4 prose-strong:font-medium prose-strong:text-ink prose-li:text-xl/relaxed prose-li:text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Reveal>

      {extras?.figure ? <Section title={extras.figure.title}>{extras.figure.render()}</Section> : null}
    </JournalPage>
  );
}
