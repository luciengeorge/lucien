import { NavLink } from "#/components/ui/nav-link";
import { SOCIAL_LINKS } from "#/lib/social-links";

/*
 * The site chrome is a floating nav pill with no room for the pages nobody
 * navigates to on purpose (contact, privacy) or the files only agents read.
 * Content pages scroll, so they can carry a footer, which is where both belong.
 */
const PAGES = [
  { to: "/about", label: "About" },
  { to: "/work", label: "Work" },
  { to: "/writing", label: "Writing" },
  { to: "/skills", label: "Skills" },
  { to: "/education", label: "Education" },
  { to: "/resume", label: "CV" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy" },
] as const;

const MACHINE_READABLE = [
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/llms-full.txt", label: "llms-full.txt" },
  { href: "/index.md", label: "index.md" },
  { href: "/sitemap.xml", label: "sitemap.xml" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl border-t border-neutral-950/10 px-4 py-10 sm:px-6">
      <nav aria-label="Pages">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {PAGES.map((page) => (
            <li key={page.to}>
              <NavLink to={page.to} className="text-neutral-600 transition-colors hover:text-neutral-950">
                {page.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="For agents" className="mt-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-neutral-500 uppercase">For agents</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs">
          {MACHINE_READABLE.map((file) => (
            <li key={file.href}>
              <a href={file.href} className="text-neutral-500 transition-colors hover:text-neutral-950">
                {file.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-xs text-neutral-400">
          Every page also answers <code>Accept: text/markdown</code>.
        </p>
      </nav>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
        <p>Lucien George, London.</p>
        <ul className="flex flex-wrap gap-x-3">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer me"
                className="transition-colors hover:text-neutral-950"
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
