import { ContentPage } from "#/components/content/content-page";
import { NotFound } from "#/components/not-found";
import { formatArticleDate } from "#/lib/content/article-date";
import { buildWritingEntryMeta } from "#/lib/content/page-meta";
import { findWritingEntry } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/writing/$slug")({
  loader: ({ params }) => {
    const entry = findWritingEntry(params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  component: WritingSlugPage,
  notFoundComponent: NotFound,
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const url = `${SITE_URL}/writing/${loaderData.slug}`;
    const { title, description } = buildWritingEntryMeta(loaderData);
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: loaderData.title,
      description: loaderData.description,
      url,
      datePublished: loaderData.published,
      ...(loaderData.updated ? { dateModified: loaderData.updated } : {}),
      author: { "@id": `${SITE_URL}/#person` },
      publisher: { "@id": `${SITE_URL}/#person` },
      isPartOf: { "@type": "Blog", "@id": `${SITE_URL}/writing` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Writing", item: `${SITE_URL}/writing` },
        { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
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

function WritingSlugPage() {
  const entry = Route.useLoaderData();
  const published = formatArticleDate(entry.published);

  return (
    <ContentPage
      back={{ to: "/writing", label: "Back to writing" }}
      eyebrow={entry.updated ? `${published} · updated ${formatArticleDate(entry.updated)}` : published}
      title={entry.title}
      titleViewTransitionName={`article-title-${entry.slug}`}
      sources={[entry.source]}
    />
  );
}
