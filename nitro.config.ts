import { defineNitroConfig } from "nitro/config";

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://vercel.live",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://eu-assets.i.posthog.com https://us-assets.i.posthog.com https://ui.sh/ui-picker.js https://www.googletagmanager.com",
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

export default defineNitroConfig({
  routeRules: {
    "/**": {
      headers: securityHeaders,
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
  },
});
