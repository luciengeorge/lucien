import { ContentPage } from "#/components/content/content-page";
import { PRIVACY_META } from "#/lib/content/page-meta";
import { PRIVACY_SOURCES } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = PRIVACY_META;
const URL = `${SITE_URL}/privacy`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () =>
    buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "website",
      jsonLd: [structuredData],
      markdownUrl: `${URL}.md`,
    }),
});

function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Privacy"
      title="What this site collects"
      intro="A personal site with an AI assistant on it, not a product with accounts. This is the whole picture."
      sources={PRIVACY_SOURCES}
    />
  );
}
