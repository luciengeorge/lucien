import { loadResume } from "#/lib/resume/load";
import { ResumeDocument } from "#/lib/resume/pdf-document";
import { CACHE_HEADER } from "#/lib/site-config";
import { renderToBuffer } from "@react-pdf/renderer";
import { createFileRoute } from "@tanstack/react-router";

const RESUME_FILENAME = "lucien-george-resume.pdf";

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

function resolveBaseUrl(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.host) return `${url.protocol}//${url.host}`;
  } catch {
    // ignore
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
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
            },
            status: 304,
          });
        }

        const baseUrl = resolveBaseUrl(request);
        const buffer = await renderToBuffer(<ResumeDocument baseUrl={baseUrl} resume={resume} />);

        return new Response(new Uint8Array(buffer), {
          headers: {
            "Cache-Control": CACHE_HEADER,
            "Content-Disposition": `inline; filename="${RESUME_FILENAME}"`,
            "Content-Type": "application/pdf",
            ETag: etag,
          },
          status: 200,
        });
      },
    },
  },
});
