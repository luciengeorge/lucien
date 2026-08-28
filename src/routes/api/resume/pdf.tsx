import { loadResume } from "#/lib/resume/load";
import { ResumeDocument } from "#/lib/resume/pdf-document";
import { CACHE_HEADER, SITE_URL } from "#/lib/site-config";
import { renderToBuffer } from "@react-pdf/renderer";
import { createFileRoute } from "@tanstack/react-router";

const RESUME_FILENAME = "lucien-george-resume.pdf";

/**
 * Keeps the PDF out of search results while leaving it crawlable, so /resume
 * stays the one indexed representation of the CV. robots.txt allows this path
 * precisely so crawlers can fetch it and read this header.
 */
const NOINDEX = "noindex";

async function hashEtag(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return `"${hex.slice(0, 16)}"`;
}

export const Route = createFileRoute("/api/resume/pdf")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resume = loadResume();
        const etag = await hashEtag(JSON.stringify(resume));

        if (request.headers.get("if-none-match") === etag) {
          return new Response(null, {
            headers: {
              "Cache-Control": CACHE_HEADER,
              ETag: etag,
              "X-Robots-Tag": NOINDEX,
            },
            status: 304,
          });
        }

        // Company logos are fetched server-side while rendering, so they have to
        // come from an origin this request can actually read. Resolving them
        // against the request's own host breaks on protected preview
        // deployments: the self-fetch is redirected to the login page, and
        // react-pdf rejects the extensionless redirect target ("Not valid image
        // extension") and silently drops the image. The canonical origin serves
        // the same assets, publicly, from every environment.
        const buffer = await renderToBuffer(<ResumeDocument baseUrl={SITE_URL} resume={resume} />);

        return new Response(new Uint8Array(buffer), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Disposition": `inline; filename="${RESUME_FILENAME}"`,
            "Content-Type": "application/pdf",
            ETag: etag,
            "X-Robots-Tag": NOINDEX,
          },
          status: 200,
        });
      },
    },
  },
});
