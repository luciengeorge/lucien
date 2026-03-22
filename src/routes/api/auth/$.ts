import { createFileRoute } from "@tanstack/react-router";
import { handler } from "#/lib/auth-server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        console.log("[auth] GET", request.url, "CONVEX_URL:", process.env.VITE_CONVEX_URL, "SITE_URL:", process.env.VITE_CONVEX_SITE_URL);
        return handler(request);
      },
      POST: ({ request }) => {
        console.log("[auth] POST", request.url, "CONVEX_URL:", process.env.VITE_CONVEX_URL, "SITE_URL:", process.env.VITE_CONVEX_SITE_URL);
        return handler(request);
      },
    },
  },
});
