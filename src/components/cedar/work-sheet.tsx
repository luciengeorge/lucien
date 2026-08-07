import type { WorkEntry } from "#/lib/content/registry";
import type { ReactNode } from "react";

import { CompanyLogo } from "#/components/resume/company-logo";
import { renderMarkdown } from "#/lib/content/markdown";
import { formatWorkPeriod, workPeriodLeadIn } from "#/lib/content/work-period";
import { Link } from "@tanstack/react-router";

import { Reveal } from "../field-notes/reveal";
import { AsideNote, AsideVoice, CedarPage, PageHeader, Section } from "./cedar-page";
import { DownloadCvLink } from "./download-cv-link";
import { FyxerSequence } from "./illustrations/fyxer-sequence";

interface WorkStat {
  label: string;
  value: string;
}

interface SheetExtras {
  figure?: { render: () => ReactNode; title: string };
  stats?: WorkStat[];
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
      { label: "REACH", value: "1,000 weekly active users" },
      { label: "RECORDED", value: "~10,000 calls, within months of launch" },
      { label: "THE TEAM", value: "Two. Lucien and Serafin." },
    ],
  },
};

/**
 * One company: the header names the span and the place, the prose tells what
 * happened there, and the aside carries the facts you would otherwise have to
 * dig out of the text.
 *
 * Body copy is Geist, so the `prose` defaults are overridden per element:
 * Tailwind Typography sets colour and family expectations on the container,
 * which would otherwise win over an inherited `text-ink`. Headings keep
 * Fraunces from the base layer, which is the one place display type belongs.
 */
export function WorkSheet({ entry }: { entry: WorkEntry }) {
  const extras = SHEET_EXTRAS[entry.slug];
  const html = renderMarkdown(entry.source);

  return (
    <CedarPage
      aside={
        <>
          <AsideNote label="ROLE">{entry.role}</AsideNote>
          <AsideNote label="PERIOD">{formatWorkPeriod(entry.period)}</AsideNote>
          {extras?.stats?.map((stat) => (
            <AsideNote key={stat.label} label={stat.label}>
              {stat.value}
            </AsideNote>
          ))}
          <AsideVoice>Ask the page anything about this one.</AsideVoice>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <Reveal>
          <Link
            className="inline-flex items-baseline gap-2 font-mono text-[11px] tracking-[0.14em] text-label transition-colors hover:text-cedar"
            to="/work"
            viewTransition
          >
            <span aria-hidden>←</span>
            BACK TO WORK
          </Link>
        </Reveal>

        <Reveal>
          <CompanyLogo
            className="size-11 text-xs"
            color={entry.color}
            company={entry.company}
            logo={entry.logo}
            style={{ viewTransitionName: `work-logo-${entry.slug}` }}
          />
        </Reveal>

        <PageHeader leadIn={workPeriodLeadIn(entry.period)} title={entry.company}>
          <p className="mt-1 font-sans text-lg text-cedar">{entry.role}</p>
          <DownloadCvLink className="mt-3" />
        </PageHeader>
      </div>

      <Reveal>
        <div
          className="prose max-w-none font-sans prose-headings:text-ink prose-p:text-[17px]/relaxed prose-p:text-ink prose-a:text-cedar prose-a:underline prose-a:underline-offset-4 prose-strong:font-semibold prose-strong:text-ink prose-li:text-[17px]/relaxed prose-li:text-ink"
          data-slot="work-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Reveal>

      {extras?.figure ? <Section title={extras.figure.title}>{extras.figure.render()}</Section> : null}
    </CedarPage>
  );
}
