import { authClient } from "#/lib/auth-client";
import { createLogger } from "#/lib/logger";
import { useEffect, useRef, useState } from "react";

import { getPostHog, loadPostHog } from "./client";

const logger = createLogger("posthog.provider");

/**
 * Headless posthog bootstrapper. Rendered as a sibling (not a wrapper) so the
 * lazy posthog-js load never remounts the app tree. Loads + inits posthog after
 * hydration and keeps user identity in sync with the auth session.
 */
export default function PostHogInit() {
  const { data: session } = authClient.useSession();
  const [ready, setReady] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPostHog()
      .then((client) => {
        if (!cancelled && client) setReady(true);
      })
      .catch((error) => logger.error("posthog load failed", { error }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const client = getPostHog();
    if (!client) return;

    if (!session?.user) {
      if (previousUserIdRef.current) {
        client.reset();
        logger.info("posthog reset", { previousUserId: previousUserIdRef.current });
        previousUserIdRef.current = null;
      }
      return;
    }

    previousUserIdRef.current = session.user.id;
    client.identify(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    });
    logger.info("posthog identify", { userId: session.user.id });
  }, [ready, session?.user]);

  return null;
}
