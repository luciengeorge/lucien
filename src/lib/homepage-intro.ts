import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import { HOMEPAGE_INTRO_FALLBACK } from "./chat-intro";
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
  if (!CONVEX_URL) {
    return HOMEPAGE_INTRO_FALLBACK;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("homepage intro timeout")), INTRO_TIMEOUT_MS);
    });

    const result = await Promise.race([client.action(api.intro.getCachedIntro, {}), timeout]);

    return typeof result === "string" && result.trim().length > 0 ? result : HOMEPAGE_INTRO_FALLBACK;
  } catch (error) {
    logger.error("homepage intro fetch failed", { error });
    return HOMEPAGE_INTRO_FALLBACK;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
