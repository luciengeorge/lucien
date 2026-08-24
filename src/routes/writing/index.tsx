import { PageScroll } from "#/components/page-scroll";
import { formatArticleDate } from "#/lib/content/article-date";
import { WRITING_INDEX_META } from "#/lib/content/page-meta";
import { WRITING_ENTRIES } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = WRITING_INDEX_META;
const URL = `${SITE_URL}/writing`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Blog",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  author: { "@id": `${SITE_URL}/#person` },
  blogPost: WRITING_ENTRIES.map((entry) => ({
    "@type": "BlogPosting",
    headline: entry.title,
    description: entry.description,
    datePublished: entry.published,
    ...(entry.updated ? { dateModified: entry.updated } : {}),
    url: `${SITE_URL}/writing/${entry.slug}`,
  })),
};

export const Route = createFileRoute("/writing/")({
  component: WritingIndexPage,
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

function WritingIndexPage() {
  return (
    <PageScroll>
      <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10 sm:pb-20">
        <header className="mb-10 border-b border-neutral-950/10 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Writing</h1>
          <p className="mt-4 max-w-[46rem] text-base text-neutral-600">
            Notes on things Lucien has built, how they work, and where they turned out to be wrong.
          </p>
        </header>

        <ol className="flex flex-col gap-4">
          {WRITING_ENTRIES.map((entry) => (
            <li key={entry.slug}>
              <Link
                to="/writing/$slug"
                params={{ slug: entry.slug }}
                viewTransition
                className="group flex flex-col rounded-2xl border border-neutral-950/8 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-neutral-950/15 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] sm:p-6"
              >
                <time
                  className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
                  dateTime={entry.published}
                >
                  {formatArticleDate(entry.published)}
                </time>
                <h2
                  className="mt-2 text-lg font-semibold tracking-tight text-neutral-950"
                  style={{ viewTransitionName: `article-title-${entry.slug}` }}
                >
                  {entry.title}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">{entry.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors group-hover:text-neutral-950">
                  Read more
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </article>
    </PageScroll>
  );
}
