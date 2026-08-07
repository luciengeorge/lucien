import { JournalPage, MarginNote, MarginVoice, PageHeader } from "#/components/field-notes/journal-page";
import { RevealGroup, RevealItem } from "#/components/field-notes/reveal";
import { EDUCATION_META } from "#/lib/content/page-meta";
import { loadResume } from "#/lib/resume/load";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = EDUCATION_META;
const URL = `${SITE_URL}/education`;

const structuredData = (alumniOf: string[]) => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: {
    "@type": "Person",
    name: "Lucien George",
    alumniOf: alumniOf.map((school) => ({ "@type": "EducationalOrganization", name: school })),
  },
});

export const Route = createFileRoute("/education")({
  loader: () => loadResume().education,
  component: EducationPage,
  head: ({ loaderData }) => {
    const alumniOf = loaderData ? loaderData.map((entry) => entry.school) : [];
    return buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "profile",
      jsonLd: [structuredData(alumniOf)],
      markdownUrl: `${URL}.md`,
    });
  },
});

interface Entry {
  institution: string;
  note?: string;
  qualification: string;
  years: string;
}

const ENTRIES: Entry[] = [
  {
    institution: "McGill University, Montreal",
    note: "Built Android apps along the way: a soccer scorekeeper for referees, a postal rate calculator, SnowMore for finding snow shovellers, and a kinesthetic recorder using Fourier transforms. Worked out here that he preferred the hands-on side of software to the process and documentation side.",
    qualification: "BENG, SOFTWARE ENGINEERING",
    years: "2013 · 2018",
  },
  {
    institution: "UNSW, Sydney",
    note: "An artificial intelligence course, taught in Prolog. Ten years early, as it turns out.",
    qualification: "EXCHANGE SEMESTER",
    years: "2016",
  },
  {
    institution: "Le Wagon London, Batch 190",
    note: "After McGill he disliked software engineering enough to apply to BCG and Oliver Wyman. A friend pointed him at Le Wagon and he gave it one last chance. Coding all day with a teacher in the room was the opposite of McGill's theory, and it worked. He built an Airbnb for boats and an activity generator for indecisive people, then went back to building for good.",
    qualification: "FULLSTACK BOOTCAMP, 9 WEEKS",
    years: "2018",
  },
  {
    institution: "Harvard Business School, Boston",
    qualification: "FAMILIES IN BUSINESS, ONE WEEK",
    years: "2022",
  },
];

export function EducationPage() {
  return (
    <JournalPage
      margin={
        <>
          <MarginVoice>The interesting part is the gap in 2018, where he nearly stopped altogether.</MarginVoice>
          <MarginNote label="ALSO OBSERVED">
            Two internships at Dataflow in Beirut. A government education site, then an interactive reader for schools.
          </MarginNote>
        </>
      }
    >
      <PageHeader meta="chronology · 2013 to 2022" title="Education" />

      <RevealGroup as="ol" className="flex flex-col gap-12 border-l rule-dashed pl-10">
        {ENTRIES.map((entry) => (
          <RevealItem as="li" className="flex flex-col gap-3 sm:flex-row sm:gap-8" key={entry.institution}>
            <p className="w-[104px] shrink-0 font-mono text-[11px] tracking-[0.14em] text-rust">{entry.years}</p>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl text-ink">{entry.institution}</h2>
              <p className="font-mono text-[11px] tracking-[0.14em] text-pen">{entry.qualification}</p>
              {entry.note ? (
                <p className="mt-1 max-w-[760px] font-display text-lg/relaxed text-ink-soft">{entry.note}</p>
              ) : null}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </JournalPage>
  );
}
