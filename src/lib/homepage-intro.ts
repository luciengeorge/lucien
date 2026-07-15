import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import { HOMEPAGE_INTRO_FALLBACK } from "./chat-intro";
import { getOrCreateCorrelationId } from "./correlation-id";
import { createLogger } from "./logger";

const logger = createLogger("homepage.intro");
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const INTRO_TIMEOUT_MS = 3000;

/**
 * Fetches the cached LLM intro for the (edge-cacheable) homepage document.
 *
 * Uses a plain, unauthenticated ConvexHttpClient on purpose: it must NOT touch
 * the session / set any cookie, otherwise the SSR response becomes
 * uncacheable. getCachedIntro is a public action, so no auth is needed. Falls
 * back to a static string on any error/timeout so the document always renders
 * fast (and the resulting HTML stays identical for every visitor → cacheable).
 */
export async function fetchHomepageIntro(): Promise<string> {
  // Generated fresh per invocation (not derived from the request) so log lines for this
  // call correlate together without making the cacheable response request-specific.
  const correlationId = getOrCreateCorrelationId(undefined);
  const startedAt = Date.now();

  if (!CONVEX_URL) {
    logger.info("homepage intro skipped", {
      correlationId,
      operation: "fetch-homepage-intro",
      outcome: "no_convex_url",
    });
    return HOMEPAGE_INTRO_FALLBACK;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("homepage intro timeout")), INTRO_TIMEOUT_MS);
    });

    const result = await Promise.race([client.action(api.intro.getCachedIntro, {}), timeout]);
    const intro = typeof result === "string" && result.trim().length > 0 ? result : HOMEPAGE_INTRO_FALLBACK;

    logger.info("homepage intro completed", {
      correlationId,
      durationMs: Date.now() - startedAt,
      operation: "fetch-homepage-intro",
      outcome: "success",
    });
    return intro;
  } catch (error) {
    logger.error("homepage intro fetch failed", {
      correlationId,
      durationMs: Date.now() - startedAt,
      error,
      operation: "fetch-homepage-intro",
    });
    return HOMEPAGE_INTRO_FALLBACK;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
