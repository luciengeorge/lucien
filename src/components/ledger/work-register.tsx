import { CompanyLogo } from "#/components/resume/company-logo";
import { WORK_META } from "#/lib/content/work-meta";
import { compressWorkPeriod, workPeriodStart } from "#/lib/content/work-period";
import { Link } from "@tanstack/react-router";

import { RevealGroup, RevealItem } from "../motion-primitives/reveal";

/** Rows are numbered rather than bulleted: 01, 02, and so on down the page. */
export function workNumeral(index: number): string {
  return String(index + 1).padStart(2, "0");
}

const FIRST_YEAR = workPeriodStart(WORK_META[WORK_META.length - 1].period);

/**
 * The work index as an itemised account: one hairline-ruled entry per company,
 * each reaching across a dotted leader to the years it covers, and a total
 * ruled off underneath.
 *
 * The company logo keeps the marker slot rather than a plain square, because
 * it carries the shared `viewTransitionName` that hands the row over to the
 * detail page. It is held in greyscale so seven brand palettes cannot fight
 * the two this page has, and comes back to colour on hover - the row you are
 * reaching for is the one that gets its colour back.
 */
export function WorkRegister() {
  return (
    <div className="flex flex-col">
      <RevealGroup as="ul" className="flex flex-col border-t rule-ink">
        {WORK_META.map((entry, index) => (
          <RevealItem as="li" className="border-b rule-hair" key={entry.slug}>
            <Link
              className="group flex flex-col gap-3 py-6 sm:py-7"
              params={{ slug: entry.slug }}
              to="/work/$slug"
              viewTransition
            >
              {/*
                One period element, not one per breakpoint: a second copy for
                small screens would put the same dates in the accessibility
                tree twice. The row wraps instead, and only the leader and the
                arrow - both decorative - drop out below `sm`.
              */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                <span className="w-[26px] shrink-0 font-mono text-[11px] text-label">{workNumeral(index)}</span>
                <CompanyLogo
                  className="size-6 shrink-0 self-center text-[9px] opacity-80 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0"
                  color={entry.color}
                  company={entry.company}
                  logo={entry.logo}
                  style={{ viewTransitionName: `work-logo-${entry.slug}` }}
                />
                <span className="min-w-0 shrink-0 font-mono text-lg font-semibold tracking-[0.02em] text-ink uppercase transition-colors group-hover:text-stamp sm:text-xl">
                  {entry.company}
                </span>
                <span aria-hidden className="hidden leader sm:block" />
                <span className="shrink-0 font-mono text-[13px] whitespace-nowrap text-ink-soft">
                  {compressWorkPeriod(entry.period)}
                </span>
                <span
                  aria-hidden
                  className="hidden w-4 shrink-0 text-right font-mono text-[15px] text-stamp transition-transform group-hover:translate-x-1 sm:block"
                >
                  →
                </span>
              </div>

              <div className="flex flex-col gap-1.5 pl-[42px]">
                <span className="font-mono text-[11px] tracking-[0.16em] text-label uppercase">{entry.role}</span>
                <span className="max-w-[46rem] font-sans text-[15px]/relaxed text-ink-soft">{entry.summary}</span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="flex items-baseline gap-3.5 border-t rule-ink pt-4">
        <span className="shrink-0 font-mono text-[13px] font-bold tracking-[0.06em] text-ink">TOTAL</span>
        <span aria-hidden className="leader" />
        <span className="shrink-0 font-mono text-[13px] font-bold whitespace-nowrap text-ink">
          {`${WORK_META.length} entries · ${FIRST_YEAR} to now`}
        </span>
      </div>
    </div>
  );
}
