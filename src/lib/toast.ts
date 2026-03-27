import z from "zod";

export const TOAST_COOKIE = "toast";

const ToastSchema = z.object({
  title: z.string().optional(),
  description: z.string(),
  status: z.enum(["success", "error", "warning", "info"]).default("info"),
});

export type Toast = z.infer<typeof ToastSchema>;
export type ToastInput = z.input<typeof ToastSchema>;

export function toastHeaders(toast: ToastInput): Headers {
  const value = JSON.stringify(ToastSchema.parse(toast));
  const cookie = `${TOAST_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=10`;
  return new Headers({ "Set-Cookie": cookie });
}

export function parseToastCookie(cookieHeader: string | null): Toast | null {
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TOAST_COOKIE}=`));

  if (!match) return null;

  const raw = decodeURIComponent(match.slice(TOAST_COOKIE.length + 1));
  const result = ToastSchema.safeParse(JSON.parse(raw));
  return result.success ? result.data : null;
}
