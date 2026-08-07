import { AsideNote, AsideVoice, CedarPage, PageHeader } from "#/components/cedar/cedar-page";
import { DownloadCvLink } from "#/components/cedar/download-cv-link";
import { WorkRegister } from "#/components/cedar/work-register";
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

const PLACE_COUNT = WORK_ENTRIES.length;
const FIRST_YEAR = workPeriodStart(WORK_ENTRIES[WORK_ENTRIES.length - 1].period);

function WorkIndexPage() {
  return (
    <CedarPage
      aside={
        <>
          <AsideVoice>Most recent first. The one at the top is still going.</AsideVoice>
          <AsideNote label="SPAN">{`${PLACE_COUNT} places, ${FIRST_YEAR} to now.`}</AsideNote>
          <AsideNote label="RANGE">Teaching, engineering leadership, founding, and building.</AsideNote>
        </>
      }
    >
      <PageHeader leadIn="built at" title="Work">
        <DownloadCvLink className="mt-4" />
      </PageHeader>
      <WorkRegister />
    </CedarPage>
  );
}
