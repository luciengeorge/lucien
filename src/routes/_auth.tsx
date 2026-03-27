import { getSession } from "#/lib/functions/get-session";
import { toastHeaders } from "#/lib/toast";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({
        to: "/",
        headers: toastHeaders({
          description: "You are already logged in",
          status: "info",
        }),
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
