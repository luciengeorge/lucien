import { getOrCreateCorrelationId } from "#/lib/correlation-id";
import { createLogger } from "#/lib/logger";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestHost, getRequestProtocol } from "@tanstack/react-start/server";
import { z } from "zod";

const logger = createLogger("session.get");

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
  const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
  const startedAt = Date.now();
  const cookie = getRequestHeader("cookie");
  // No cookies → definitely no session; skip the network round-trip.
  if (!cookie) {
    logger.info("session lookup skipped", { correlationId, operation: "get-session", outcome: "no_cookie" });
    return null;
  }

  const origin = `${getRequestProtocol()}://${getRequestHost()}`;

  try {
    const response = await fetch(`${origin}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!response.ok) {
      logger.warn("session lookup failed", {
        correlationId,
        durationMs: Date.now() - startedAt,
        operation: "get-session",
        outcome: "auth_endpoint_error",
        status: response.status,
      });
      return null;
    }

    const parsed = SessionResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.warn("session lookup failed", {
        correlationId,
        durationMs: Date.now() - startedAt,
        operation: "get-session",
        outcome: "invalid_response",
      });
      return null;
    }

    const { user } = parsed.data;
    logger.info("session lookup completed", {
      correlationId,
      durationMs: Date.now() - startedAt,
      operation: "get-session",
      outcome: "authenticated",
    });
    return {
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.name ?? "",
      },
    };
  } catch (error) {
    logger.error("session lookup errored", {
      correlationId,
      durationMs: Date.now() - startedAt,
      error,
      operation: "get-session",
      outcome: "exception",
    });
    return null;
  }
});
