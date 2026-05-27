import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Toaster } from "#/components/ui/sonner";
import { useToast } from "#/hooks/use-toast";
import { getToast } from "#/lib/functions/get-toast";
import { SOCIAL_LINKS } from "#/lib/social-links";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import ConvexProvider from "../integrations/convex/provider";
import { GoogleAnalyticsPageViews, GoogleAnalyticsScripts } from "../integrations/google-analytics/provider";
import PostHogProvider from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

const SITE_URL = "https://www.luciengeorge.com";
const TITLE = "Lucien George | Senior Product Engineer at Fyxer";
const DESCRIPTION =
  "Lucien George is a Senior Product Engineer at Fyxer. Explore his work, background, projects, and interests through Poof, his AI-powered portfolio assistant.";
const OG_IMAGE_URL = `${SITE_URL}/cover.png`;
const TWITTER_HANDLE = "@luciengeorge16";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: "Lucien George",
      jobTitle: "Senior Product Engineer",
      sameAs: SOCIAL_LINKS.map((link) => link.href),
      url: SITE_URL,
      worksFor: {
        "@type": "Organization",
        name: "Fyxer AI",
      },
    },
    {
      "@type": "WebSite",
      description: DESCRIPTION,
      image: OG_IMAGE_URL,
      name: "Lucien George",
      url: SITE_URL,
    },
  ],
};

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
        content: "4800",
      },
      {
        property: "og:image:height",
        content: "2520",
      },
      {
        property: "og:site_name",
        content: "Lucien George",
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
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: SITE_URL,
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
  const { serverToast } = Route.useRouteContext();
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
        <Analytics />
        <SpeedInsights />
        <GoogleAnalyticsPageViews />
        <ConvexProvider>
          <PostHogProvider>
            <TanStackQueryProvider>
              <Toaster closeButton richColors />
              <main className="isolate flex h-dvh min-h-0 w-full flex-col overflow-hidden py-2 sm:py-6">
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
          </PostHogProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
