import { redirect, type RedirectOptions } from '@tanstack/react-router';
import { setCookie } from '@tanstack/react-start/server';
import z from 'zod';

export const TOAST_COOKIE = 'toast';

const ToastSchema = z.object({
  title: z.string().optional(),
  description: z.string(),
  status: z.enum(['success', 'error', 'warning', 'info']).default('info'),
});

export type Toast = z.infer<typeof ToastSchema>;
export type ToastInput = z.input<typeof ToastSchema>;

interface RedirectWithToastProps extends RedirectOptions {
  toast: ToastInput;
}
export function redirectWithToast({ toast, ...props }: RedirectWithToastProps) {
  setCookie(TOAST_COOKIE, JSON.stringify(toast));
  return redirect(props);
}

export function parseToastCookie(cookie: string | null): Toast | null {
  if (!cookie) return null;

  const result = ToastSchema.safeParse(JSON.parse(cookie));
  return result.success ? result.data : null;
}
