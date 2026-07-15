import { DownloadCvButton } from "#/components/download-cv-button";
import { CompanyLogo } from "#/components/resume/company-logo";
import { WORK_ENTRIES } from "#/lib/content/registry";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, createFileRoute } from "@tanstack/react-router";

const TITLE = "Lucien George | Work history";
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
  head: () =>
    buildSeoHead({ title: TITLE, description: DESCRIPTION, url: URL, type: "website", jsonLd: [structuredData] }),
});

function WorkIndexPage() {
  return (
    <div className="min-h-0 grow overflow-y-auto">
      <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10 sm:pb-20">
        <header className="mb-10 flex flex-col gap-6 border-b border-neutral-950/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Work</p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Work history</h1>
            <p className="mt-4 text-base text-neutral-600">
              Where Lucien has worked, what he built, and what he learned along the way.
            </p>
          </div>
          <DownloadCvButton />
        </header>

        <ol className="flex flex-col gap-4">
          {WORK_ENTRIES.map((entry) => (
            <li key={entry.slug}>
              <Link
                to="/work/$slug"
                params={{ slug: entry.slug }}
                viewTransition
                className="group flex gap-4 rounded-2xl border border-neutral-950/8 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-neutral-950/15 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] sm:p-6"
              >
                <CompanyLogo
                  className="size-11 shrink-0 text-sm sm:size-12"
                  color={entry.color}
                  company={entry.company}
                  logo={entry.logo}
                  style={{ viewTransitionName: `work-logo-${entry.slug}` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2
                      className="text-lg font-semibold tracking-tight text-neutral-950"
                      style={{ viewTransitionName: `work-title-${entry.slug}` }}
                    >
                      {entry.company}
                    </h2>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase">
                      {entry.period}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500">{entry.role}</p>
                  <p className="mt-2 text-sm text-neutral-600">{entry.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors group-hover:text-neutral-950">
                    Read more
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}
