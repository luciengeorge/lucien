import type { Toast } from "#/lib/toast";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { GlobalLoading } from "#/components/global-loading";
import { LedgerColophon, LedgerNav } from "#/components/ledger/ledger-nav";
import { NotFound } from "#/components/not-found";
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
import { MotionConfig } from "motion/react";
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
        content: "#f4f1e9",
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
            {/*
              reducedMotion="user" is the single place this contract is set: it
              strips transform and layout animations for anyone who has asked
              their OS for less motion, while leaving opacity alone so content
              still arrives. SVG path drawing is geometry rather than transform,
              so it is opted out separately inside the illustrations themselves.
            */}
            <MotionConfig reducedMotion="user">
              <PostHogInit />
              <Toaster closeButton richColors />
              <LedgerNav />
              <main className="isolate w-full">{children}</main>
              {/*
                The colophon lives outside <main> on purpose: a <footer> nested
                inside main does not expose the contentinfo role, and this is
                site-level furniture rather than page content.
              */}
              <LedgerColophon className="mx-auto w-full max-w-[1520px] px-6 pb-14 sm:px-10 lg:px-14" />
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
            </MotionConfig>
          </TanStackQueryProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
