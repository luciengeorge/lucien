import { createServerFn } from "@tanstack/react-start";

import { useToastSession } from "../toast-session.server";
import { ToastSchema } from "../toast";

export const setToast = createServerFn({ method: "POST" })
  .inputValidator(ToastSchema)
  .handler(async ({ data }) => {
    const session = await useToastSession();
    await session.update({ toast: data });

    return null;
  });
