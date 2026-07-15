import { getOrCreateCorrelationId } from "#/lib/correlation-id";
import { createLogger } from "#/lib/logger";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { ToastSchema } from "../toast";
import { useToastSession } from "../toast-session.server";

const logger = createLogger("toast.set");

export const setToast = createServerFn({ method: "POST" })
  .inputValidator(ToastSchema)
  .handler(async ({ data }) => {
    const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
    const session = await useToastSession();
    await session.update({ toast: data });

    logger.info("toast set", { correlationId, operation: "set-toast", outcome: "success", status: data.status });

    return null;
  });
