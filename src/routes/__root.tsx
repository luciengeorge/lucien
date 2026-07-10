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
import { SOCIAL_LINKS } from "#/lib/social-links";
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

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Lucien George",
      givenName: "Lucien",
      familyName: "George",
      jobTitle: "Senior Product Engineer",
      description:
        "Senior Product Engineer at Fyxer. Builds products end-to-end, teaches, races karts, and runs ultras in London. Originally from Beirut, Lebanon.",
      image: OG_IMAGE_URL,
      url: SITE_URL,
      email: "lucienkgeorge@gmail.com",
      sameAs: SOCIAL_LINKS.map((link) => link.href),
      address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
      birthPlace: { "@type": "Place", name: "Beirut, Lebanon" },
      nationality: { "@type": "Country", name: "Lebanon" },
      knowsLanguage: ["English", "French", "Arabic"],
      knowsAbout: [
        "TypeScript",
        "JavaScript",
        "React",
        "TanStack",
        "Tailwind CSS",
        "Convex",
        "AI applications",
        "RAG",
        "Ruby on Rails",
        "Python",
        "Electron",
        "Native iOS",
        "Native Android",
        "React Native",
      ],
      alumniOf: [
        { "@type": "EducationalOrganization", name: "McGill University" },
        { "@type": "EducationalOrganization", name: "Le Wagon" },
        { "@type": "EducationalOrganization", name: "Harvard Business School" },
        { "@type": "EducationalOrganization", name: "University of New South Wales" },
      ],
      worksFor: { "@type": "Organization", name: "Fyxer", url: "https://www.fyxer.com" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      description: DESCRIPTION,
      image: OG_IMAGE_URL,
      name: "Lucien George",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#person` },
      inLanguage: "en-GB",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Who is Lucien George?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien George is a Senior Product Engineer at Fyxer, based in London and originally from Beirut, Lebanon. He builds products end-to-end and previously worked at Shopify, Le Wagon, and co-founded Localista, Skyla, and Impact Lebanon.",
          },
        },
        {
          "@type": "Question",
          name: "What does Lucien do at Fyxer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien is a Senior Product Engineer leading development of Fyxer's notetaker product - a native macOS and Windows desktop app (Electron) that records meetings in the background without a bot. The product reached 1,000 weekly active users within months of launch.",
          },
        },
        {
          "@type": "Question",
          name: "Where is Lucien based?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien is based in London, UK. He grew up in Beirut, Lebanon, and lived in Montreal, Canada while studying software engineering at McGill University.",
          },
        },
        {
          "@type": "Question",
          name: "What is Lucien's tech stack?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien's primary stack is TypeScript and React with the TanStack ecosystem (Start, Router, Query, Form), Tailwind CSS, shadcn/ui, and Convex on the backend. He has deep experience with Ruby on Rails, Python, Electron, and native mobile (Swift/Kotlin/React Native).",
          },
        },
        {
          "@type": "Question",
          name: "Where did Lucien study?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien holds a Bachelor of Engineering in Software Engineering from McGill University (2013–2018), with an exchange semester at UNSW Sydney. He also attended Le Wagon London (Batch #190, 2018) and Harvard Business School's Families in Business program (2022).",
          },
        },
        {
          "@type": "Question",
          name: "What languages does Lucien speak?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lucien speaks English, French, and Arabic fluently.",
          },
        },
      ],
    },
  ],
};

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
