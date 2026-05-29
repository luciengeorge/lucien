import { ContentPage } from "#/components/content/content-page";
import { DownloadCvButton } from "#/components/download-cv-button";
import { NotFound } from "#/components/not-found";
import { CompanyLogo } from "#/components/resume/company-logo";
import { findWorkEntry } from "#/lib/content/registry";
import { createFileRoute, notFound } from "@tanstack/react-router";

const SITE_URL = "https://www.luciengeorge.com";

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
    const title = `${loaderData.role} at ${loaderData.company} — Lucien George`;
    const description = loaderData.summary;
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
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(structuredData) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumb) },
      ],
    };
  },
});

function WorkSlugPage() {
  const entry = Route.useLoaderData();

  return (
    <ContentPage
      back={{ to: "/work", label: "Back to work" }}
      media={
        <CompanyLogo
          className="size-14 text-base"
          color={entry.color}
          company={entry.company}
          logo={entry.logo}
          style={{ viewTransitionName: `work-logo-${entry.slug}` }}
        />
      }
      actions={<DownloadCvButton />}
      eyebrow={`${entry.role} · ${entry.period}`}
      title={entry.company}
      titleViewTransitionName={`work-title-${entry.slug}`}
      intro={entry.summary}
      sources={[entry.source]}
    />
  );
}
