import type { Resume } from "#/lib/resume/schema";
import type { ReactNode } from "react";

import { JournalPage, MarginNote, MarginVoice, PageHeader } from "#/components/field-notes/journal-page";
import { Reveal, RevealGroup, RevealItem } from "#/components/field-notes/reveal";
import { RESUME_META } from "#/lib/content/page-meta";
import { WORK_META } from "#/lib/content/work-meta";
import { compressWorkPeriod } from "#/lib/content/work-period";
import { loadResume } from "#/lib/resume/load";
import { buildSeoHead } from "#/lib/seo";
import { OG_IMAGE_URL, SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const RESUME_URL = `${SITE_URL}/resume`;
const PDF_URL = "/api/resume/pdf";
const { title: TITLE, description: DESCRIPTION } = RESUME_META;

export const Route = createFileRoute("/resume")({
  component: ResumePage,
  loader: () => loadResume(),
  head: ({ loaderData }) => {
    const resume = loaderData;
    const structuredData = resume
      ? {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: RESUME_URL,
          name: TITLE,
          description: DESCRIPTION,
          mainEntity: {
            "@type": "Person",
            name: resume.personal.name,
            jobTitle: resume.personal.title,
            email: resume.personal.email,
            url: SITE_URL,
            address: { "@type": "PostalAddress", addressLocality: resume.personal.location },
            sameAs: [resume.personal.links.github, resume.personal.links.linkedin].filter((value): value is string =>
              Boolean(value),
            ),
            knowsAbout: resume.skills.programming,
            knowsLanguage: resume.skills.spokenLanguages,
            alumniOf: resume.education.map((entry) => ({
              "@type": "EducationalOrganization",
              name: entry.school,
            })),
            worksFor: { "@type": "Organization", name: resume.experiences[0]?.company ?? "Fyxer" },
          },
        }
      : null;
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Resume", item: RESUME_URL },
      ],
    };
    return buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: RESUME_URL,
      type: "profile",
      image: OG_IMAGE_URL,
      jsonLd: [structuredData, breadcrumb],
      markdownUrl: `${RESUME_URL}.md`,
    });
  },
});

const PROFILE =
  "Fullstack developer and product engineer in London, originally from Beirut. Senior Product Engineer at Fyxer, leading the notetaker desktop app for macOS and Windows. Before that, two companies as co-founder, native checkout SDKs at Shopify, and the London engineering team at Le Wagon.";

const EDUCATION =
  "BEng Software Engineering, McGill University. Le Wagon London, Batch 190. Families in Business, Harvard Business School.";

function ResumePage() {
  return <ResumeView resume={Route.useLoaderData()} />;
}

export function ResumeView({ resume }: { resume: Resume }) {
  return (
    <JournalPage
      margin={
        <>
          <MarginVoice>The short version, for people who want the short version.</MarginVoice>
          <MarginNote label="ALSO AVAILABLE AS">
            <ul className="flex flex-col gap-1 font-mono text-sm not-italic">
              <li>
                <a className="text-pen transition-colors hover:text-ink" href="/resume.md">
                  /resume.md
                </a>
              </li>
              <li>
                <a className="text-pen transition-colors hover:text-ink" href="/llms-full.txt">
                  /llms-full.txt
                </a>
              </li>
            </ul>
          </MarginNote>
          <MarginNote>Or just ask the page. It has read all of this.</MarginNote>
        </>
      }
    >
      {/*
        A CV page's h1 should be the person, not the document type: it is what
        the page is about and what Person structured data claims. "Curriculum
        vitae" carries the design as the line beneath it.
      */}
      <PageHeader meta="the journal, printed · one page" title="Lucien George">
        <p className="font-display text-2xl text-pen italic">Curriculum vitae</p>
        <a
          className="group mt-2 inline-flex items-center gap-2 self-start print:hidden"
          download="lucien-george-resume.pdf"
          href={PDF_URL}
          rel="noreferrer"
          target="_blank"
        >
          <span className="border-b border-ink pb-0.5 font-mono text-xs tracking-[0.14em] text-ink">DOWNLOAD PDF</span>
          <span aria-hidden className="text-rust transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </a>
      </PageHeader>

      <div className="flex max-w-[900px] flex-col">
        <CvSection label="PROFILE">
          <p className="font-display text-lg/relaxed text-ink">{PROFILE}</p>
        </CvSection>

        <CvSection label="EXPERIENCE">
          <RevealGroup as="ul" className="flex flex-col gap-5">
            {WORK_META.map((entry) => (
              <RevealItem
                as="li"
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6"
                key={entry.slug}
              >
                <p className="font-display text-xl text-ink italic sm:w-[210px] sm:shrink-0">{entry.company}</p>
                <p className="flex-1 font-display text-base text-ink-soft">{entry.role}</p>
                <p className="shrink-0 font-mono text-[11px] text-label sm:w-[92px] sm:text-right">
                  {compressWorkPeriod(entry.period)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </CvSection>

        <CvSection label="EDUCATION">
          <p className="font-display text-lg/relaxed text-ink-soft">{EDUCATION}</p>
        </CvSection>

        <CvSection label="LANGUAGES">
          <p className="font-display text-lg/relaxed text-ink-soft">{resume.skills.spokenLanguages.join(", ")}.</p>
        </CvSection>
      </div>
    </JournalPage>
  );
}

/** A ruled row of the printed CV: rust label lane on the left, content on the right. */
function CvSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Reveal className="flex flex-col gap-3 border-t rule-dashed py-7 last:border-b sm:flex-row sm:gap-10">
      <p className="pt-1.5 font-mono text-[11px] tracking-[0.14em] text-rust sm:w-[150px] sm:shrink-0">{label}</p>
      <div className="min-w-0 flex-1">{children}</div>
    </Reveal>
  );
}
