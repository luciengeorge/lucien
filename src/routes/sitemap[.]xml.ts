import { WORK_ENTRIES, WRITING_ENTRIES } from "#/lib/content/registry";
import { CACHE_HEADER, SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

/** Last commit date per file under `content/`, injected at build time. */
declare const __CONTENT_LAST_MODIFIED__: Record<string, string>;

interface SitemapEntry {
  loc: string;
  /** Omitted when the build could not establish a real date - see `lastmodOf`. */
  lastmod?: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

export const CONTENT_DATES: Record<string, string> =
  typeof __CONTENT_LAST_MODIFIED__ === "object" && __CONTENT_LAST_MODIFIED__ ? __CONTENT_LAST_MODIFIED__ : {};

/**
 * Newest commit date across the files a page is built from, or nothing when the
 * build could not date any of them. ISO dates sort lexically, so no parsing.
 *
 * Returning nothing matters: a `lastmod` Google finds inaccurate gets the whole
 * sitemap's dates discounted, so an absent one beats a guessed one.
 */
function lastmodOf(...files: string[]): string | undefined {
  let newest: string | undefined;
  for (const file of files) {
    const date = CONTENT_DATES[file];
    if (date && (!newest || date > newest)) newest = date;
  }
  return newest;
}

/** Every content file, for the homepage, which summarises all of them. */
const ALL_CONTENT = Object.keys(CONTENT_DATES);

export function buildSitemap(): string {
  const workFiles = WORK_ENTRIES.map((entry) => `${entry.slug}.md`);
  const writingDates = WRITING_ENTRIES.map((entry) => entry.updated ?? entry.published);

  const entries: SitemapEntry[] = [
    { loc: `${SITE_URL}/`, lastmod: lastmodOf(...ALL_CONTENT), changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/about`, lastmod: lastmodOf("bio.md", "personal.md"), changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/work`, lastmod: lastmodOf(...workFiles), changefreq: "monthly", priority: "0.9" },
    ...WORK_ENTRIES.map<SitemapEntry>((entry) => ({
      loc: `${SITE_URL}/work/${entry.slug}`,
      lastmod: lastmodOf(`${entry.slug}.md`),
      changefreq: "monthly",
      priority: "0.7",
    })),
    {
      loc: `${SITE_URL}/writing`,
      lastmod: writingDates.sort().at(-1),
      changefreq: "monthly",
      priority: "0.8",
    },
    ...WRITING_ENTRIES.map<SitemapEntry>((entry) => ({
      loc: `${SITE_URL}/writing/${entry.slug}`,
      lastmod: entry.updated ?? entry.published,
      changefreq: "yearly",
      priority: "0.7",
    })),
    { loc: `${SITE_URL}/skills`, lastmod: lastmodOf("tech-stack.md"), changefreq: "monthly", priority: "0.8" },
    { loc: `${SITE_URL}/education`, lastmod: lastmodOf("education.md"), changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/resume`, lastmod: lastmodOf("resume.json"), changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/contact`, lastmod: lastmodOf("contact.md"), changefreq: "yearly", priority: "0.6" },
    { loc: `${SITE_URL}/privacy`, lastmod: lastmodOf("privacy.md"), changefreq: "yearly", priority: "0.3" },
  ];

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${entry.loc}</loc>${lastmod}\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Type": "application/xml; charset=utf-8",
          },
          status: 200,
        }),
    },
  },
});
