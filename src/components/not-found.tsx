import { buttonVariants } from "#/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "#/components/ui/empty";
import { NavLink } from "#/components/ui/nav-link";
import { cn } from "#/lib/utils";
import { Compass01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

/*
 * A dead end is where a visitor (and an agent) gives up, so the page says where
 * to go instead of only apologising. Clients that did not ask for HTML get the
 * same routes as a markdown body, see `lib/not-found-markdown.ts`.
 */
const DESTINATIONS = [
  { to: "/about", label: "About" },
  { to: "/work", label: "Work" },
  { to: "/writing", label: "Writing" },
  { to: "/skills", label: "Skills" },
  { to: "/education", label: "Education" },
  { to: "/resume", label: "CV" },
] as const;

const MACHINE_READABLE = [
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/index.md", label: "index.md" },
  { href: "/sitemap.xml", label: "sitemap.xml" },
] as const;

export function NotFound() {
  return (
    <div className="flex min-h-0 grow items-center justify-center overflow-y-auto px-4 py-8 sm:px-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-10 rounded-full">
            <HugeiconsIcon icon={Compass01Icon} />
          </EmptyMedia>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Error 404</p>
          <EmptyTitle className="text-xl sm:text-2xl">Poof - this page vanished</EmptyTitle>
          <EmptyDescription>
            The page you're looking for doesn't exist, has moved, or never existed in the first place.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NavLink to="/" className={cn(buttonVariants(), "rounded-full")}>
            Back to chat
          </NavLink>
          <nav aria-label="Where to look next" className="mt-6 w-full">
            <p className="font-mono text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Where to look next</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-sm">
              {DESTINATIONS.map((destination) => (
                <li key={destination.to}>
                  <NavLink
                    to={destination.to}
                    className="text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-950"
                  >
                    {destination.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 font-mono text-xs">
              {MACHINE_READABLE.map((file) => (
                <li key={file.href}>
                  <a
                    href={file.href}
                    className="text-neutral-500 underline underline-offset-2 transition-colors hover:text-neutral-950"
                  >
                    {file.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </EmptyContent>
      </Empty>
    </div>
  );
}
