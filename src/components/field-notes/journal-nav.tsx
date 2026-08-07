import type { LinkComponentProps } from "@tanstack/react-router";

import { SOCIAL_LINKS } from "#/lib/social-links";
import { cn } from "#/lib/utils";
import { Link } from "@tanstack/react-router";

type NavTo = LinkComponentProps<"a">["to"];

interface NavItem {
  to: NavTo;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Chat", to: "/" },
  { label: "About", to: "/about" },
  { label: "Work", to: "/work" },
  { label: "Skills", to: "/skills" },
  { label: "Education", to: "/education" },
  { label: "CV", to: "/resume" },
];

/**
 * The journal's masthead. Not a floating pill - a ruled header, the way a
 * bound volume names itself on every page.
 *
 * The active page is marked by switching face rather than by a background
 * fill: mono for the rest, Fraunces italic in pen blue for where you are.
 */
export function JournalNav() {
  return (
    <header className="border-b rule-dashed">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1680px] flex-col gap-3 px-6 py-5 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16"
      >
        <div className="flex items-baseline gap-3 sm:gap-4">
          <Link
            to="/"
            className="font-mono text-[11px] font-medium tracking-[0.3em] text-ink transition-colors hover:text-pen"
          >
            LUCIEN GEORGE
          </Link>
          <span aria-hidden className="hidden font-mono text-[11px] tracking-[0.14em] text-label sm:inline">
            FIELD JOURNAL · Vol.8
          </span>
        </div>

        <ul className="-mx-1 flex items-center gap-4 overflow-x-auto px-1 sm:gap-7">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="font-mono text-xs tracking-[0.08em] whitespace-nowrap text-label-strong transition-colors hover:text-ink"
                activeProps={{
                  className: "font-display text-[15px] italic tracking-normal text-pen hover:text-pen",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/**
 * The colophon. Repeats the specimen line from the journal's cover so every
 * page is identifiably part of the same volume.
 */
export function JournalFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-20 border-t rule-dashed pt-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] tracking-[0.08em] text-label-strong">
          SPECIMEN: builder · teacher · racer · habitat: the mountains
        </p>
        <ul className="flex items-center gap-5 sm:gap-6">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] tracking-[0.08em] text-label-strong transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
