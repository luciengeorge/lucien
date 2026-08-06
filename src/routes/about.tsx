import { ContentPage } from "#/components/content/content-page";
import { ABOUT_META } from "#/lib/content/page-meta";
import { ABOUT_SOURCES } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = ABOUT_META;
const URL = `${SITE_URL}/about`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: { "@type": "Person", name: "Lucien George" },
};

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () =>
    buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "profile",
      jsonLd: [structuredData],
      markdownUrl: `${URL}.md`,
    }),
});

function AboutPage() {
  return (
    <ContentPage
      eyebrow="About"
      title="Lucien George"
      intro="Senior product engineer at Fyxer. Builds products, teaches, races karts, and runs ultras."
      sources={ABOUT_SOURCES}
    />
  );
}
