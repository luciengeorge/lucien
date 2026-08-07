import { WorkSheet } from "#/components/cedar/work-sheet";
import { NotFound } from "#/components/not-found";
import { buildWorkEntryMeta } from "#/lib/content/page-meta";
import { findWorkEntry } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const entry = findWorkEntry(params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  component: WorkSlugPage,
  notFoundComponent: NotFound,
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const url = `${SITE_URL}/work/${loaderData.slug}`;
    const { title, description } = buildWorkEntryMeta(loaderData);
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url,
      author: { "@type": "Person", name: "Lucien George", url: SITE_URL },
      about: { "@type": "Organization", name: loaderData.company },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Work", item: `${SITE_URL}/work` },
        { "@type": "ListItem", position: 3, name: loaderData.company, item: url },
      ],
    };
    return buildSeoHead({
      title,
      description,
      url,
      type: "article",
      jsonLd: [structuredData, breadcrumb],
      markdownUrl: `${url}.md`,
    });
  },
});

function WorkSlugPage() {
  const entry = Route.useLoaderData();

  return <WorkSheet entry={entry} />;
}
