import { DownloadCvLink } from "#/components/field-notes/download-cv-link";
import { JournalPage, MarginNote, MarginVoice, PageHeader } from "#/components/field-notes/journal-page";
import { WorkRegister, specimenNumeral } from "#/components/field-notes/work-register";
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

const SPECIMEN_COUNT = specimenNumeral(WORK_ENTRIES.length - 1);
const FIRST_YEAR = workPeriodStart(WORK_ENTRIES[WORK_ENTRIES.length - 1].period);

function WorkIndexPage() {
  return (
    <JournalPage
      margin={
        <>
          <MarginVoice>Seven records, in reverse order of sighting. The most recent is still in progress.</MarginVoice>
          <MarginNote label="RANGE">Teaching, engineering leadership, founding, and building.</MarginNote>
        </>
      }
    >
      <PageHeader meta={`collected records · ${SPECIMEN_COUNT} specimens · ${FIRST_YEAR} to present`} title="Work">
        <DownloadCvLink className="mt-2" />
      </PageHeader>
      <WorkRegister />
    </JournalPage>
  );
}
