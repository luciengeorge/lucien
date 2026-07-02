import type { LinkComponentProps } from "@tanstack/react-router";

import { InitialsMark } from "#/components/initials-mark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { SOCIAL_LINKS } from "#/lib/social-links";
import { cn } from "#/lib/utils";
import {
  GithubIcon,
  InstagramIcon,
  Linkedin01Icon,
  Menu01Icon,
  NewTwitterIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";

type NavTo = LinkComponentProps<"a">["to"];

interface NavItem {
  to: NavTo;
  label: string;
}

const PRIMARY_ITEMS: NavItem[] = [
  { to: "/", label: "Chat" },
  { to: "/about", label: "About" },
  { to: "/work", label: "Work" },
  { to: "/skills", label: "Skills" },
  { to: "/education", label: "Education" },
];

const CV_ITEM: NavItem = { to: "/resume", label: "CV" };
const ALL_ITEMS: NavItem[] = [...PRIMARY_ITEMS, CV_ITEM];

const SOCIAL_ICONS: Record<string, typeof GithubIcon> = {
  GitHub: GithubIcon,
  LinkedIn: Linkedin01Icon,
  X: NewTwitterIcon,
  Instagram: InstagramIcon,
};

/**
 * Glass surface - Apple-style frosted-glass treatment.
 *
 * - Low-opacity bg lets the layer below show through
 * - High blur + saturation = the "vivid frosted" Apple look
 * - Inner ring + soft shadow give the floating-pane illusion
 * - `supports-` query lets older browsers fall back to a more opaque solid
 */
const GLASS_CLASSES = [
  "bg-white/55",
  "supports-backdrop-filter:bg-white/40",
  "backdrop-blur-2xl",
  "backdrop-saturate-150",
  "ring-1 ring-neutral-950/10",
  "shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_8px_24px_-12px_rgba(15,23,42,0.18)]",
].join(" ");

function SocialCluster({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {SOCIAL_LINKS.map((link) => {
        const icon = SOCIAL_ICONS[link.label];
        if (!icon) return null;
        return (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              className="inline-flex size-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-950/5 hover:text-neutral-950"
            >
              <HugeiconsIcon icon={icon} size={size} strokeWidth={1.6} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function NavLinkPill({ to, label }: NavItem) {
  return (
    <Link
      to={to}
      className="inline-block rounded-full px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-950"
      activeProps={{ className: "bg-neutral-950/8 text-neutral-950" }}
      activeOptions={{ exact: to === "/" }}
    >
      {label}
    </Link>
  );
}

/**
 * Mobile menu - uses shadcn's Base UI dropdown-menu so we inherit the same
 * frosted-glass popup styling as the rest of the design system.
 */
function MobileMenu() {
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open menu"
        className={cn(
          "pointer-events-auto inline-flex size-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-950/5 hover:text-neutral-950 lg:hidden",
          GLASS_CLASSES,
        )}
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
        <DropdownMenuGroup>
          {ALL_ITEMS.map((item) => {
            const path = String(item.to);
            const isActive = path === "/" ? currentPath === "/" : currentPath.startsWith(path);
            return (
              <DropdownMenuItem
                key={item.label}
                data-active={isActive || undefined}
                className={cn(isActive && "bg-foreground/10 text-neutral-950")}
                onClick={() => {
                  void navigate({ to: item.to });
                }}
              >
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {SOCIAL_LINKS.map((link) => {
            const icon = SOCIAL_ICONS[link.label];
            return (
              <DropdownMenuItem
                key={link.label}
                onClick={() => {
                  window.open(link.href, "_blank", "noopener,noreferrer");
                }}
              >
                {icon ? <HugeiconsIcon icon={icon} size={14} strokeWidth={1.6} /> : null}
                <span>{link.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteNav() {
  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pt-3 sm:px-6">
        {/* Desktop pill - sits centered above content */}
        <div className="hidden flex-1 justify-center lg:flex">
          <nav
            aria-label="Primary"
            className={cn("pointer-events-auto inline-flex items-center gap-1 rounded-full px-2 py-1", GLASS_CLASSES)}
          >
            <Link
              to="/"
              aria-label="Lucien George | Home"
              className="ml-1 inline-flex h-7 items-center rounded-full px-1.5 text-neutral-950"
            >
              <InitialsMark className="size-3.5" />
            </Link>
            <span aria-hidden className="h-4 w-px bg-neutral-950/10" />
            <ul className="flex items-center gap-0.5 px-1">
              {ALL_ITEMS.map((item) => (
                <li key={item.label}>
                  <NavLinkPill {...item} />
                </li>
              ))}
            </ul>
            <span aria-hidden className="h-4 w-px bg-neutral-950/10" />
            <SocialCluster className="px-1" />
          </nav>
        </div>

        {/* Mobile - monogram left, dropdown-menu trigger right */}
        <div className="flex w-full items-center justify-between gap-2 lg:hidden">
          <Link
            to="/"
            aria-label="Lucien George | Home"
            className={cn(
              "pointer-events-auto inline-flex size-9 items-center justify-center rounded-full text-neutral-950",
              GLASS_CLASSES,
            )}
          >
            <InitialsMark className="size-4" />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </div>
  );
}
