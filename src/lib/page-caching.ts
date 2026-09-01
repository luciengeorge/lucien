import { CACHE_HEADER } from "#/lib/site-config";

function isReadMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

/**
 * Holds rendered pages on the CDN.
 *
 * The `.md` twins, the sitemap and robots.txt all set `CACHE_HEADER` themselves,
 * but HTML comes out of the SSR handler, which leaves caching to the platform.
 * Vercel's default for a function response is `max-age=0, must-revalidate`, so
 * every visit and every crawl cold-starts a function: `x-vercel-cache: MISS` on
 * every request to a page, while `/work/skyla.md` sitting behind the same
 * middleware answers HIT. That is the wrong way round, since the HTML is what
 * search engines index.
 *
 * The pages are safe to hold: content only changes when a deploy ships, and a
 * deploy starts a fresh cache. Vercel keys on `Accept` by default, so markdown
 * negotiation on the canonical URL stays correct.
 *
 * Deliberately narrow. Only successful HTML reads qualify, and a response
 * carrying a cookie never does, so a session can't be served to the next
 * visitor. Vercel refuses to cache a `set-cookie` response anyway; the check is
 * here so the rule is ours and is testable, rather than borrowed.
 */
export function withPageCaching(request: Request, response: Response): Response {
  if (!isReadMethod(request.method)) return response;
  if (response.status !== 200) return response;
  if (response.headers.has("Set-Cookie")) return response;
  if (!(response.headers.get("Content-Type") ?? "").toLowerCase().startsWith("text/html")) return response;

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", CACHE_HEADER);
  return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}
