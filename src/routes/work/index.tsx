import { WORK_ENTRIES } from "#/lib/content/registry";
import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://www.luciengeorge.com";
const TITLE = "Lucien George — Work history";
const DESCRIPTION =
  "Lucien George's work history: Fyxer, Localista, Skyla, Shopify, Le Wagon, Impact Lebanon, and early roles. Each role with context, scope, and outcomes.";
const URL = `${SITE_URL}/work`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: WORK_ENTRIES.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/work/${entry.slug}`,
      name: `${entry.role} at ${entry.company}`,
    })),
  },
};

export const Route = createFileRoute("/work/")({
  component: WorkIndexPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(structuredData),
      },
    ],
  }),
});

function WorkIndexPage() {
  return (
    <div className="min-h-0 grow overflow-y-auto">
      <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10 sm:pb-20">
        <header className="mb-10 border-b border-neutral-950/10 pb-8">
          <p className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Work</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Work history</h1>
          <p className="mt-4 text-base text-neutral-600">
            Where Lucien has worked, what he built, and what he learned along the way.
          </p>
        </header>

        <ol className="divide-y divide-neutral-950/10">
          {WORK_ENTRIES.map((entry) => (
            <li key={entry.slug}>
              <Link
                to="/work/$slug"
                params={{ slug: entry.slug }}
                className="group flex flex-col gap-2 py-6 transition-colors hover:bg-neutral-950/3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-1">
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-950">{entry.company}</h2>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase">
                    {entry.period}
                  </span>
                </div>
                <p className="px-1 text-sm text-neutral-600">{entry.summary}</p>
                <span className="flex items-center gap-1 px-1 text-xs text-neutral-500 transition-colors group-hover:text-neutral-950">
                  Read more
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}
