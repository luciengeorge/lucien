import type { LinkComponentProps } from "@tanstack/react-router";

import { loadResume } from "#/lib/resume/load";
import { SOCIAL_LINKS } from "#/lib/social-links";
import { cn } from "#/lib/utils";
import { Link } from "@tanstack/react-router";

import { LedgerMark } from "./ledger-mark";

/** The one address on the site, read from the resume so there is a single copy of it. */
const CONTACT_EMAIL = loadResume().personal.email;

type NavTo = LinkComponentProps<"a">["to"];

interface NavItem {
  to: NavTo;
  label: string;
}

/**
 * Sections in reading order rather than site-map order: the page you land on
 * comes first, then the work, then the person behind it.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Ask", to: "/" },
  { label: "Work", to: "/work" },
  { label: "About", to: "/about" },
  { label: "Skills", to: "/skills" },
  { label: "Education", to: "/education" },
  { label: "Resume", to: "/resume" },
];

/**
 * The masthead: mark, wordmark, and the two facts that never change, over a
 * double rule.
 *
 * The active section is marked with a small stamp square rather than a colour
 * swap alone, because colour on its own is not a state anyone can rely on. The
 * square is `aria-hidden` and always occupies its slot, so switching pages
 * changes no layout and reads out no extra word.
 */
export function LedgerNav() {
  return (
    <header className="mx-auto w-full max-w-[1520px] px-6 pt-8 sm:px-10 lg:px-14">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-4">
        <div className="flex items-center gap-3.5">
          <Link
            aria-label="Lucien George | Home"
            className="group flex items-center gap-3.5 text-ink transition-colors hover:text-stamp"
            to="/"
          >
            <LedgerMark className="size-[22px]" />
            <span className="font-mono text-sm font-bold tracking-[0.18em]">LUCIEN GEORGE</span>
          </Link>
          <span className="hidden font-mono text-[11px] tracking-[0.3em] text-label sm:inline">PRODUCT ENGINEER</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px] tracking-[0.3em] text-label">
          <span>LONDON · GMT</span>
          <span className="hidden sm:inline">SINCE 2013</span>
        </div>
      </div>

      <div className="border-t rule-ink" />
      <div className="h-[3px]" />
      <div className="border-t rule-hair" />

      <nav
        aria-label="Primary"
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b rule-hair py-3.5"
      >
        <ul className="-mx-1 flex items-center gap-6 overflow-x-auto px-1 sm:gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-ink font-semibold" }}
                className="group flex items-center gap-2.5 font-mono text-xs tracking-[0.16em] whitespace-nowrap text-ink-soft uppercase transition-colors hover:text-ink"
                to={item.to}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 bg-stamp opacity-0 transition-opacity group-data-[status=active]:opacity-100"
                />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <a
          className="hidden font-mono text-xs tracking-[0.16em] text-ink-soft transition-colors hover:text-ink lg:inline"
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
      </nav>
    </header>
  );
}

/**
 * The colophon closes the account. The stamp is the last of the four places
 * the stamp colour appears on the site, and the only one that is decorative.
 */
export function LedgerColophon({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t rule-ink pt-8", className)}>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[13px] font-bold tracking-[0.18em] text-ink">LUCIEN GEORGE</p>
          <a
            className="font-mono text-[13px] text-ink-soft transition-colors hover:text-stamp"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <ul className="flex flex-wrap items-center gap-6 sm:gap-7">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                className="font-mono text-[11px] tracking-[0.22em] text-ink-soft uppercase transition-colors hover:text-stamp"
                href={link.href}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="-rotate-[5deg] self-start border-2 border-stamp px-4 py-1.5 font-mono text-sm font-bold tracking-[0.08em] text-stamp opacity-85 sm:self-auto">
          STILL SHIPPING
        </p>
      </div>
    </footer>
  );
}
