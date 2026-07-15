import { getOrCreateCorrelationId } from "#/lib/correlation-id";
import { createLogger } from "#/lib/logger";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { ToastSchema } from "../toast";
import { useToastSession } from "../toast-session.server";

const logger = createLogger("toast.get");

export const getToast = createServerFn({ method: "GET" }).handler(async () => {
  const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
  const session = await useToastSession();
  const result = ToastSchema.safeParse(session.data.toast);
  const toast = result.success ? result.data : null;

  if (toast) {
    await session.clear();
  }

  logger.info("toast read", {
    correlationId,
    operation: "get-toast",
    outcome: toast ? "found" : "empty",
  });

  return toast;
});
