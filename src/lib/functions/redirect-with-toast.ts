import { redirect, type RedirectOptions } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";

import { TOAST_COOKIE, type ToastInput } from "../toast";

interface RedirectWithToastProps extends RedirectOptions {
  toast: ToastInput;
}

export function redirectWithToast({ toast, ...props }: RedirectWithToastProps) {
  setCookie(TOAST_COOKIE, JSON.stringify(toast));
  throw redirect(props);
}
