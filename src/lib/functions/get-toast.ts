import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import { parseToastCookie, TOAST_COOKIE } from "../toast";

export const getToast = createServerFn({ method: "GET" }).handler(async () => {
  const cookies = getRequestHeader("cookie");
  const toast = parseToastCookie(cookies ?? null);

  if (toast) {
    setResponseHeader("Set-Cookie", `${TOAST_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  }

  return toast;
});
