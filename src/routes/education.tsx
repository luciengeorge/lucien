import { LedgerPage, PageHeader, RailAside, RailNote } from "#/components/ledger/ledger-page";
import { RevealGroup, RevealItem } from "#/components/motion-primitives/reveal";
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
  /** The city, or the cohort where the city adds nothing. */
  place: string;
  qualification: string;
  years: string;
}

const ENTRIES: Entry[] = [
  {
    institution: "McGill University",
    note: "Built Android apps along the way: a soccer scorekeeper for referees, a postal rate calculator, SnowMore for finding snow shovellers, and a kinesthetic recorder using Fourier transforms. Worked out here that he preferred the hands-on side of software to the process and documentation side.",
    place: "MONTREAL",
    qualification: "BENG, SOFTWARE ENGINEERING",
    years: "2013 · 2018",
  },
  {
    institution: "UNSW",
    note: "An artificial intelligence course, taught in Prolog. Ten years early, as it turns out.",
    place: "SYDNEY",
    qualification: "EXCHANGE SEMESTER",
    years: "2016",
  },
  {
    institution: "Le Wagon London",
    note: "After McGill he disliked software engineering enough to apply to BCG and Oliver Wyman. A friend pointed him at Le Wagon and he gave it one last chance. Coding all day with a teacher in the room was the opposite of McGill's theory, and it worked. He built an Airbnb for boats and an activity generator for indecisive people, then went back to building for good.",
    place: "BATCH 190",
    qualification: "FULLSTACK BOOTCAMP, 9 WEEKS",
    years: "2018",
  },
  {
    institution: "Harvard Business School",
    place: "BOSTON",
    qualification: "FAMILIES IN BUSINESS, ONE WEEK",
    years: "2022",
  },
];

export function EducationPage() {
  return (
    <LedgerPage
      rail={
        <>
          <RailNote label="ALSO">
            Two internships at Dataflow in Beirut. A government education site, then an interactive reader for schools.
          </RailNote>
          <RailAside>
            Five years of theory, nine weeks of practice, and the nine weeks are the ones that stuck.
          </RailAside>
        </>
      }
    >
      <PageHeader label="EDUCATION" title="Where Lucien studied">
        <p className="max-w-[41rem] font-sans text-[17px]/relaxed text-ink-soft">
          The interesting part is the gap in 2018, where he nearly stopped altogether.
        </p>
      </PageHeader>

      <RevealGroup as="ol" className="flex flex-col border-t rule-ink">
        {ENTRIES.map((entry) => (
          <RevealItem
            as="li"
            className="flex flex-col gap-3 border-b rule-hair py-7 sm:flex-row sm:gap-11"
            key={entry.institution}
          >
            <p className="w-[150px] shrink-0 pt-2 font-mono text-xs tracking-[0.14em] text-label">{entry.years}</p>
            <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-[46rem]">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="shrink-0 font-mono text-lg font-semibold tracking-[0.02em] text-ink sm:text-xl">
                  {entry.institution}
                </h2>
                <span aria-hidden className="hidden leader sm:block" />
                <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] whitespace-nowrap text-label">
                  {entry.place}
                </span>
              </div>
              <p className="font-mono text-[11px] tracking-[0.16em] text-stamp">{entry.qualification}</p>
              {entry.note ? <p className="pt-2 font-sans text-base/relaxed text-ink-soft">{entry.note}</p> : null}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </LedgerPage>
  );
}
