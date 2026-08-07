import { CompanyLogo } from "#/components/resume/company-logo";
import { WORK_META } from "#/lib/content/work-meta";
import { formatWorkPeriod } from "#/lib/content/work-period";
import { Link } from "@tanstack/react-router";

import { RevealGroup, RevealItem } from "../field-notes/reveal";

/** Rows are numbered rather than bulleted: 01, 02, and so on down the page. */
export function workNumeral(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * The work index: one stone-ruled row per company, read across fixed lanes.
 *
 * The lanes only exist from `xl` up, where there is room to hold them: the page
 * gives 280px to the aside, so at `lg` the fixed lanes leave the summary about
 * 60px to wrap in and every row grows to the height of a page. Below `xl` the
 * numeral, the logo and the company collapse onto one line via `xl:contents`,
 * which lets the same markup be a stacked card on a phone and a true five-lane
 * row on a desktop without duplicating the block.
 *
 * The period lane is fixed-width and never wraps. It is the only right-aligned
 * column, so a second line there breaks the alignment of every row below it.
 *
 * Hover is CSS, not Motion: a colour change and a 4px nudge do not need a
 * JS-driven animation, and keeping it in CSS keeps it off the main thread.
 */
export function WorkRegister() {
  return (
    <RevealGroup as="ul" className="flex flex-col border-b rule-stone">
      {WORK_META.map((entry, index) => (
        <RevealItem as="li" className="border-t rule-stone" key={entry.slug}>
          <Link
            className="group flex flex-col gap-4 py-7 sm:py-8 xl:flex-row xl:items-baseline xl:gap-8"
            params={{ slug: entry.slug }}
            to="/work/$slug"
            viewTransition
          >
            <div className="flex items-center gap-4 xl:contents">
              <span className="w-[30px] shrink-0 self-baseline font-mono text-[11px] text-label">
                {workNumeral(index)}
              </span>
              <CompanyLogo
                className="size-9 shrink-0 text-[10px] xl:w-10 xl:self-start"
                color={entry.color}
                company={entry.company}
                logo={entry.logo}
                style={{ viewTransitionName: `work-logo-${entry.slug}` }}
              />
              <span className="min-w-0 font-display text-2xl font-semibold tracking-tight text-ink transition-colors group-hover:text-cedar xl:w-[230px] xl:shrink-0">
                {entry.company}
              </span>
            </div>

            <span className="flex flex-1 flex-col gap-1.5">
              <span className="font-sans text-[15px] font-medium text-ink">{entry.role}</span>
              <span className="font-sans text-[15px]/relaxed text-ink-soft">{entry.summary}</span>
            </span>

            <span className="w-full shrink-0 font-mono text-[11px] tracking-[0.08em] whitespace-nowrap text-label xl:w-[130px] xl:text-right">
              {formatWorkPeriod(entry.period)}
            </span>

            <span
              aria-hidden
              className="hidden shrink-0 text-right font-sans text-base text-cedar transition-transform group-hover:translate-x-1 xl:block xl:w-5"
            >
              →
            </span>
          </Link>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
