import { getOrCreateCorrelationId } from "#/lib/correlation-id";
import { createLogger } from "#/lib/logger";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { getSession } from "./get-session";

const logger = createLogger("session.require");

export const requireSession = createServerFn({ method: "GET" }).handler(async () => {
  const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
  const session = await getSession();
  if (!session) {
    logger.warn("session required but missing", {
      correlationId,
      operation: "require-session",
      outcome: "unauthorized",
    });
    throw new Error("Unauthorized");
  }
  logger.info("session required and present", { correlationId, operation: "require-session", outcome: "authorized" });
  return session;
});
