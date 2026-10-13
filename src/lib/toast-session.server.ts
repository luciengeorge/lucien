import { getCookieSession } from "./cookie-session.server";
import { TOAST_COOKIE, type Toast } from "./toast";

interface ToastSessionData {
  toast?: Toast;
}

export function useToastSession() {
  return getCookieSession<ToastSessionData>(TOAST_COOKIE);
}
