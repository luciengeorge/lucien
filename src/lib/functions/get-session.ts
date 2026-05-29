import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

/**
 * Reads the current Better Auth session during SSR.
 *
 * We hit the app's own `/api/auth/get-session` endpoint with the incoming request's
 * cookies, building an absolute URL from the request host. (The better-auth *client*
 * SDK has no valid server-side baseURL, so calling it here throws "fetch failed" and
 * 500s any logged-in visit to a `_auth` route — this avoids that.)
 *
 * Returns the `{ session, user }` object, or null when unauthenticated / on error.
 */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const requestHeaders = getRequestHeaders();
  const header = (name: string): string | undefined => {
    const value = (requestHeaders as Headers).get?.(name) ?? (requestHeaders as Record<string, string>)[name];
    return value ?? undefined;
  };

  const cookie = header("cookie");
  // No cookies → definitely no session; skip the network round-trip.
  if (!cookie) return null;

  const host = header("x-forwarded-host") ?? header("host");
  const proto = header("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : (process.env.SITE_URL ?? "http://localhost:3000");

  try {
    const response = await fetch(`${origin}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      user?: { id?: string; email?: string; name?: string };
    } | null;
    const user = data?.user;
    if (!user?.id) return null;
    // Normalise to a concrete, JSON-serialisable shape (callers only need the
    // truthiness + basic user fields; the client `useSession` hook covers the rest).
    return {
      user: {
        id: String(user.id),
        email: String(user.email ?? ""),
        name: String(user.name ?? ""),
      },
    };
  } catch {
    return null;
  }
});
