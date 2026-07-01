import { WORK_ENTRIES } from "#/lib/content/registry";
import { createFileRoute } from "@tanstack/react-router";

declare const __BUILD_DATE__: string;

const SITE_URL = "https://www.luciengeorge.com";
const CACHE_HEADER = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

function buildSitemap(): string {
  // Prefer the build date (stable across requests, reflects the last deploy)
  // over per-request time, which would falsely claim every page changed today.
  const buildDate = typeof __BUILD_DATE__ === "string" ? __BUILD_DATE__ : "";
  const lastmod = buildDate || (new Date().toISOString().split("T")[0] ?? "");

  const entries: SitemapEntry[] = [
    { loc: `${SITE_URL}/`, lastmod, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/about`, lastmod, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/work`, lastmod, changefreq: "monthly", priority: "0.9" },
    ...WORK_ENTRIES.map<SitemapEntry>((entry) => ({
      loc: `${SITE_URL}/work/${entry.slug}`,
      lastmod,
      changefreq: "monthly",
      priority: "0.7",
    })),
    { loc: `${SITE_URL}/skills`, lastmod, changefreq: "monthly", priority: "0.8" },
    { loc: `${SITE_URL}/education`, lastmod, changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/resume`, lastmod, changefreq: "monthly", priority: "0.9" },
  ];

  const urls = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
    )
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
