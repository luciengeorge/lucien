import { defineNitroConfig } from "nitro/config";

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://vercel.live https://challenges.cloudflare.com",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://challenges.cloudflare.com https://eu-assets.i.posthog.com https://us-assets.i.posthog.com https://ui.sh/ui-picker.js https://www.googletagmanager.com",
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data: https:",
    "upgrade-insecure-requests",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), browsing-topics=(), interest-cohort=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// Public assets embedded by other origins (OG/social previews, favicons) must
// opt out of the default same-origin CORP or the browser blocks the fetch
// (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
const embeddableAssetHeaders = {
  ...securityHeaders,
  "Cross-Origin-Resource-Policy": "cross-origin",
};

export default defineNitroConfig({
  routeRules: {
    "/**": {
      headers: securityHeaders,
    },
    "/": {
      headers: {
        // Static, per-session-free homepage: cache the SSR document at the edge
        // so most visits skip the function entirely (no cold start, ~edge TTFB).
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
        ...securityHeaders,
      },
    },
    "/api/**": {
      headers: {
        "Cache-Control": "no-store",
        ...securityHeaders,
      },
    },
    "/api/resume/pdf": {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
        ...securityHeaders,
      },
    },
    "/resume.pdf": {
      redirect: { status: 301, to: "/api/resume/pdf" },
    },
    "/cover.png": {
      headers: embeddableAssetHeaders,
    },
    "/favicon.png": {
      headers: embeddableAssetHeaders,
    },
  },
});
