import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestHost, getRequestProtocol } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Shape we accept back from `/api/auth/get-session`. The endpoint returns
 * untrusted JSON, so we validate it rather than trusting its type. Anything
 * without a non-empty `user.id` is treated as "no session".
 */
const SessionResponseSchema = z.object({
  user: z.object({
    id: z.coerce.string().min(1),
    email: z.string().optional(),
    name: z.string().optional(),
  }),
});

/**
 * Reads the current Better Auth session during SSR.
 *
 * We hit the app's own `/api/auth/get-session` endpoint with the incoming request's
 * cookies, building an absolute URL from the request host. (The better-auth *client*
 * SDK has no valid server-side baseURL, so calling it here throws "fetch failed" and
 * 500s any logged-in visit to a `_auth` route - this avoids that.)
 *
 * Returns the `{ user }` object, or null when unauthenticated / on error.
 */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const cookie = getRequestHeader("cookie");
  // No cookies → definitely no session; skip the network round-trip.
  if (!cookie) return null;

  const origin = `${getRequestProtocol()}://${getRequestHost()}`;

  try {
    const response = await fetch(`${origin}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!response.ok) return null;

    const parsed = SessionResponseSchema.safeParse(await response.json());
    if (!parsed.success) return null;

    const { user } = parsed.data;
    return {
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.name ?? "",
      },
    };
  } catch {
    return null;
  }
});
