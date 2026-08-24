import { markdownPathFor, prefersHtml, prefersMarkdown } from "#/lib/markdown-negotiation";
import { notFoundMarkdownResponse } from "#/lib/not-found-markdown";

type FetchHandler = (request: Request) => Promise<Response> | Response;

function isReadMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

/**
 * Adds `Accept` to `Vary` without dropping what the platform already put there
 * (Vercel and Cloudflare both add `Accept-Encoding`), and without duplicating
 * an entry that is already listed.
 */
function withVaryOnAccept(response: Response): Response {
  const headers = new Headers(response.headers);
  const existing = (headers.get("Vary") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const merged = [...existing];

  for (const value of ["Accept", "Accept-Encoding"]) {
    if (!merged.some((entry) => entry.toLowerCase() === value.toLowerCase())) merged.push(value);
  }

  headers.set("Vary", merged.join(", "));
  return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}

/** The same read, asking the app for its default (HTML) representation. */
function htmlRequestFor(target: URL, request: Request): Request {
  const headers = new Headers(request.headers);
  headers.set("Accept", "text/html");
  return new Request(target, { headers, method: request.method });
}

/**
 * Serves the agent-facing representation of a request when the client asked for
 * one, and leaves everything else alone.
 *
 * Two behaviours, both scoped to reads:
 *
 * 1. Markdown content negotiation. A client that ranks `text/markdown` above
 *    `text/html` gets the page's markdown twin from the canonical URL, and both
 *    representations answer with `Vary: Accept` so a shared cache keys on it.
 * 2. Recoverable 404s. A dead end is where an agent gives up, so anything that
 *    did not explicitly ask for HTML gets a markdown 404 listing where to look
 *    next. Browsers still get the rendered 404 page.
 */
export async function withAgentRepresentation(request: Request, fetchHandler: FetchHandler): Promise<Response> {
  if (!isReadMethod(request.method)) return fetchHandler(request);

  const url = new URL(request.url);
  const accept = request.headers.get("accept");
  const markdownPath = markdownPathFor(url.pathname);
  const wantsMarkdown = prefersMarkdown(accept);

  let response: Response;
  if (wantsMarkdown) {
    /*
     * This wrapper picks the representation, so the app underneath is always
     * asked for its default one. That matters beyond tidiness: TanStack
     * Start's SSR handler answers any request that does not accept HTML with
     * `500 Only HTML requests are supported here`, so forwarding
     * `Accept: text/markdown` to a page with no markdown twin (or to a
     * missing path, which has to render the 404 route) would hand an agent a
     * server error instead of content.
     */
    const target = new URL(markdownPath ?? url.pathname, url.origin);
    target.search = url.search;
    response = await fetchHandler(htmlRequestFor(target, request));
  } else {
    response = await fetchHandler(request);
  }

  if (response.status === 404 && !prefersHtml(accept)) {
    return withVaryOnAccept(notFoundMarkdownResponse(url.pathname));
  }

  return markdownPath ? withVaryOnAccept(response) : response;
}
