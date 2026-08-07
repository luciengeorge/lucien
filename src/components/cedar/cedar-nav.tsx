import type { LinkComponentProps } from "@tanstack/react-router";

import { SOCIAL_LINKS } from "#/lib/social-links";
import { cn } from "#/lib/utils";
import { Link } from "@tanstack/react-router";

import { LanguagesLabel, RouteLabel } from "./cedar-mark";

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
 * The masthead carries the route, because "Beirut to London" is the whole
 * premise of this direction and belongs on every page rather than only on the
 * about page.
 *
 * The active route is marked in cedar green. Green is the structural accent
 * here; terracotta stays rare and is reserved for the languages line and a
 * small number of highlights, so it keeps its value.
 */
export function CedarNav() {
  return (
    <header className="border-b rule-stone">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1500px] flex-col gap-3 px-6 py-5 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-14"
      >
        <div className="flex items-baseline gap-4">
          <Link
            to="/"
            aria-label="Lucien George | Home"
            className="font-display text-lg font-semibold tracking-tight text-ink transition-colors hover:text-cedar"
          >
            Lucien George
          </Link>
          <RouteLabel className="hidden sm:inline" />
        </div>

        <ul className="-mx-1 flex items-center gap-5 overflow-x-auto px-1 sm:gap-7">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="font-sans text-sm whitespace-nowrap text-ink-soft transition-colors hover:text-ink"
                activeProps={{ className: "text-cedar font-medium hover:text-cedar" }}
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

export function CedarFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-20 border-t rule-stone pt-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-sm text-ink-soft">
          From the cedar coast to London. Three languages, one builder. <LanguagesLabel className="ml-2" />
        </p>
        <ul className="flex items-center gap-5 sm:gap-6">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm text-ink-soft transition-colors hover:text-cedar"
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
