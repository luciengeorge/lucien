import { ContentPage } from "#/components/content/content-page";
import { CONTACT_META } from "#/lib/content/page-meta";
import { CONTACT_SOURCES } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = CONTACT_META;
const URL = `${SITE_URL}/contact`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: { "@id": `${SITE_URL}/#person` },
};

export const Route = createFileRoute("/contact")({
  component: ContactPage,
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

function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Get in touch"
      intro="Email is fastest. The assistant on the homepage can also pass a message along."
      sources={CONTACT_SOURCES}
    />
  );
}
