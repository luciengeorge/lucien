export const SITE_URL = "https://www.luciengeorge.com";
export const OG_IMAGE_URL = `${SITE_URL}/cover.png`;
export const CACHE_HEADER = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
// Verified with a real Chromium browser (Playwright, tests/e2e/seo.spec.ts): navigating
// to a `.md` route renders the raw text inline, no download is triggered.
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
