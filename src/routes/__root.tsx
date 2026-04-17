import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "#/components/ui/sonner";
import { useToast } from "#/hooks/use-toast";
import { getToast } from "#/lib/functions/get-toast";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { SpeedInsights } from "@vercel/speed-insights/react";

import ConvexProvider from "../integrations/convex/provider";
import PostHogProvider from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const serverToast = await getToast();
    return { serverToast };
  },
  component: RootComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Lucien George",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootComponent() {
  const { serverToast } = Route.useRouteContext();
  useToast(serverToast);

  return <Outlet />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased">
        <SpeedInsights />
        <ConvexProvider>
          <PostHogProvider>
            <TanStackQueryProvider>
              <Toaster closeButton richColors />
              <main className="isolate flex h-dvh min-h-0 w-full flex-col overflow-hidden py-6">{children}</main>
              <TanStackDevtools
                config={{
                  position: "bottom-right",
                }}
                plugins={[
                  {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  TanStackQueryDevtools,
                ]}
              />
            </TanStackQueryProvider>
          </PostHogProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
