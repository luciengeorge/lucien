import type { Toast } from "#/lib/toast";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { GlobalLoading } from "#/components/global-loading";
import { NotFound } from "#/components/not-found";
import { SiteNav } from "#/components/site-nav";
import { Toaster } from "#/components/ui/sonner";
import { useToast } from "#/hooks/use-toast";
import { getToast } from "#/lib/functions/get-toast";
import { OG_IMAGE_URL, SITE_URL } from "#/lib/site-config";
import { structuredData } from "#/lib/structured-data";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect, useState } from "react";

import ConvexProvider from "../integrations/convex/provider";
import { GoogleAnalyticsPageViews, GoogleAnalyticsScripts } from "../integrations/google-analytics/provider";
import PostHogInit from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

const TITLE = "Lucien George | Senior Product Engineer at Fyxer";
const DESCRIPTION =
  "Senior Product Engineer at Fyxer. Explore Lucien George's work, projects, and interests via Poof, his AI portfolio assistant.";
const TWITTER_HANDLE = "@luciengeorge16";

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
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
        title: TITLE,
      },
      {
        name: "description",
        content: DESCRIPTION,
      },
      {
        name: "robots",
        content: "index, follow",
      },
      {
        name: "author",
        content: "Lucien George",
      },
      {
        name: "theme-color",
        content: "#131a2b",
      },
      {
        property: "og:title",
        content: TITLE,
      },
      {
        property: "og:description",
        content: DESCRIPTION,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: SITE_URL,
      },
      {
        property: "og:image",
        content: OG_IMAGE_URL,
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:image:type",
        content: "image/png",
      },
      {
        property: "og:image:alt",
        content: "Lucien George, Senior Product Engineer at Fyxer",
      },
      {
        property: "og:site_name",
        content: "Lucien George",
      },
      {
        property: "og:locale",
        content: "en_GB",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:site",
        content: TWITTER_HANDLE,
      },
      {
        name: "twitter:creator",
        content: TWITTER_HANDLE,
      },
      {
        name: "twitter:title",
        content: TITLE,
      },
      {
        name: "twitter:description",
        content: DESCRIPTION,
      },
      {
        name: "twitter:image",
        content: OG_IMAGE_URL,
      },
      {
        name: "twitter:image:alt",
        content: "Lucien George, Senior Product Engineer at Fyxer",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/favicon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootComponent() {
  // Read the one-shot server toast client-side (after hydration) instead of in
  // beforeLoad, so SSR documents carry no Set-Cookie and stay edge-cacheable.
  const [serverToast, setServerToast] = useState<Toast | null>(null);

  useEffect(() => {
    let active = true;
    void getToast()
      .then((toast) => {
        if (active) setServerToast(toast);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useToast(serverToast);

  return <Outlet />;
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <GoogleAnalyticsScripts />
      </head>
      <body className="font-sans wrap-anywhere antialiased">
        <GlobalLoading />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalyticsPageViews />
        <ConvexProvider>
          <TanStackQueryProvider>
            <PostHogInit />
            <Toaster closeButton richColors />
            <SiteNav />
            <main className="isolate flex h-dvh min-h-0 w-full flex-col overflow-hidden pt-14 pb-2 sm:pt-16 sm:pb-6">
              {children}
            </main>
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
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
