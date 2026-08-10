import { RailStat, RailStats } from "#/components/ledger/leader-row";
import { LedgerPage, PageHeader, RailAside } from "#/components/ledger/ledger-page";
import { WorkRegister } from "#/components/ledger/work-register";
import { WORK_INDEX_META } from "#/lib/content/page-meta";
import { WORK_ENTRIES } from "#/lib/content/registry";
import { workPeriodStart } from "#/lib/content/work-period";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = WORK_INDEX_META;
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
    buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "website",
      jsonLd: [structuredData],
      markdownUrl: `${URL}.md`,
    }),
});

const ENTRY_COUNT = WORK_ENTRIES.length;
const FIRST_YEAR = workPeriodStart(WORK_ENTRIES[WORK_ENTRIES.length - 1].period);
/* Derived rather than typed out, so founding another one is a data change. */
const FOUNDED_COUNT = WORK_ENTRIES.filter((entry) => entry.role.toLowerCase().includes("co-founder")).length;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function WorkIndexPage() {
  return (
    <LedgerPage
      rail={
        <>
          <RailStats label="ACCOUNT">
            <RailStat label="ENTRIES" value={pad(ENTRY_COUNT)} />
            <RailStat label="SPAN" value={`${FIRST_YEAR} · now`} />
            <RailStat label="FOUNDED" value={pad(FOUNDED_COUNT)} />
          </RailStats>
          <RailAside>Three of these he started himself. The other four he joined and treated the same way.</RailAside>
        </>
      }
    >
      <PageHeader label="WORK" title="Where Lucien has worked">
        <p className="max-w-[41rem] font-sans text-[17px]/relaxed text-ink-soft">
          Most recent first. Open one for the long version.
        </p>
      </PageHeader>
      <WorkRegister />
    </LedgerPage>
  );
}
