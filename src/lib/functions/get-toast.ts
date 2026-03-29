import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";

import { parseToastCookie, TOAST_COOKIE } from "../toast";

export const getToast = createServerFn({ method: "GET" }).handler(async () => {
  const toastCookie = getCookie(TOAST_COOKIE);
  const toast = parseToastCookie(toastCookie ?? null);
  if (toast) {
    deleteCookie(TOAST_COOKIE);
  }

  return toast;
});
