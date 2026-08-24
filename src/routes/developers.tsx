import { ContentPage } from "#/components/content/content-page";
import { DEVELOPERS_META } from "#/lib/content/page-meta";
import { DEVELOPERS_SOURCES } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = DEVELOPERS_META;
const URL = `${SITE_URL}/developers`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  url: URL,
  name: TITLE,
  headline: "Developer and agent resources for luciengeorge.com",
  description: DESCRIPTION,
  author: { "@id": `${SITE_URL}/#person` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  isAccessibleForFree: true,
  about: ["llms.txt", "Markdown content negotiation", "schema.org JSON-LD", "AI agent readability"],
};

export const Route = createFileRoute("/developers")({
  component: DevelopersPage,
  head: () =>
    buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "article",
      jsonLd: [structuredData],
      markdownUrl: `${URL}.md`,
    }),
});

function DevelopersPage() {
  return (
    <ContentPage
      eyebrow="For developers and agents"
      title="Reading this site with software"
      intro="Every page has a markdown twin, the canonical URLs negotiate markdown, and the site's own source is public."
      sources={DEVELOPERS_SOURCES}
    />
  );
}
