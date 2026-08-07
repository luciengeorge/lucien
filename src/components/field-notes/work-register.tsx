import { CompanyLogo } from "#/components/resume/company-logo";
import { WORK_META } from "#/lib/content/work-meta";
import { formatWorkPeriod } from "#/lib/content/work-period";
import { Link } from "@tanstack/react-router";

import { RevealGroup, RevealItem } from "./reveal";

/** Specimens are numbered, not bulleted: 01, 02, and so on down the register. */
export function specimenNumeral(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * The register: one ruled line per specimen, read across fixed lanes.
 *
 * The lanes only exist from `lg` up, where there is room to hold them. Below
 * that the numeral, the logo and the company collapse onto one line via
 * `lg:contents`, which lets the same markup be a stacked card on a phone and a
 * true five-lane row on a desktop without duplicating the block.
 *
 * Hover is CSS, not Motion: six rows of colour and a 4px nudge do not need a
 * JS-driven animation, and keeping it in CSS keeps it off the main thread.
 */
export function WorkRegister() {
  return (
    <RevealGroup as="ul" className="flex flex-col border-b rule-dashed">
      {WORK_META.map((entry, index) => (
        <RevealItem as="li" className="border-t rule-dashed" key={entry.slug}>
          <Link
            className="group flex flex-col gap-4 py-8 sm:py-10 lg:flex-row lg:items-baseline lg:gap-8"
            params={{ slug: entry.slug }}
            to="/work/$slug"
            viewTransition
          >
            <div className="flex items-center gap-4 lg:contents">
              <span className="w-[30px] shrink-0 self-baseline font-mono text-[11px] text-rust">
                {specimenNumeral(index)}
              </span>
              <CompanyLogo
                className="size-9 shrink-0 text-[10px] opacity-90 lg:w-10 lg:self-start"
                color={entry.color}
                company={entry.company}
                logo={entry.logo}
                style={{ viewTransitionName: `work-logo-${entry.slug}` }}
              />
              <span className="flex min-w-0 flex-col gap-1.5 lg:w-[250px] lg:shrink-0">
                <span className="font-display text-2xl text-ink italic transition-colors group-hover:text-pen">
                  {entry.company}
                </span>
                <span className="font-mono text-[11px] tracking-[0.08em] text-label">
                  {formatWorkPeriod(entry.period)}
                </span>
              </span>
            </div>

            <span className="flex flex-1 flex-col gap-2">
              <span className="font-mono text-[11px] tracking-[0.14em] text-pen uppercase">{entry.role}</span>
              <span className="font-display text-lg/relaxed text-ink-soft">{entry.summary}</span>
            </span>

            <span
              aria-hidden
              className="w-full shrink-0 text-right font-display text-xl text-rust italic transition-transform group-hover:translate-x-1 lg:w-6"
            >
              →
            </span>
          </Link>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
