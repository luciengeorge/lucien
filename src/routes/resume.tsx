import type { Resume } from "#/lib/resume/schema";
import type { ReactNode } from "react";

import { DownloadResumeLink } from "#/components/ledger/download-resume-link";
import { LedgerPage, PageHeader, RailAside, RailNote } from "#/components/ledger/ledger-page";
import { Reveal, RevealGroup, RevealItem } from "#/components/motion-primitives/reveal";
import { RESUME_META } from "#/lib/content/page-meta";
import { WORK_META } from "#/lib/content/work-meta";
import { compressWorkPeriod } from "#/lib/content/work-period";
import { loadResume } from "#/lib/resume/load";
import { buildSeoHead } from "#/lib/seo";
import { OG_IMAGE_URL, SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const RESUME_URL = `${SITE_URL}/resume`;
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

const MACHINE_COPIES = ["/resume.md", "/llms-full.txt"];

function ResumePage() {
  return <ResumeView resume={Route.useLoaderData()} />;
}

export function ResumeView({ resume }: { resume: Resume }) {
  return (
    <LedgerPage
      rail={
        <>
          <RailNote label="ALSO AVAILABLE AS">
            <ul className="flex flex-col gap-2">
              {MACHINE_COPIES.map((href) => (
                <li key={href}>
                  {/*
                    No leader here. A filename reaching an arrow is not a label
                    reaching a value, and a leader used for spacing alone stops
                    meaning anything where it is doing real work.
                  */}
                  <a className="group flex items-baseline justify-between gap-3" href={href}>
                    <span className="font-mono text-xs text-ink-soft transition-colors group-hover:text-ink">
                      {href}
                    </span>
                    <span
                      aria-hidden
                      className="font-mono text-xs text-stamp transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </RailNote>
          <RailAside>Or just ask the page. It has read all of this.</RailAside>
        </>
      }
    >
      {/*
        A resume page's h1 should be the person, not the document type: it is
        what the page is about and what the Person structured data claims. The
        section label above it carries the word "resume".
      */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <PageHeader label="RESUME" title="Lucien George">
          <p className="font-sans text-[17px]/relaxed text-ink-soft">The short version. One page, kept current.</p>
        </PageHeader>
        <Reveal delay={0.06}>
          <DownloadResumeLink />
        </Reveal>
      </div>

      <div className="flex max-w-[56rem] flex-col border-t rule-ink">
        <CvSection label="PROFILE">
          <p className="font-sans text-base/relaxed text-ink">{PROFILE}</p>
        </CvSection>

        <CvSection label="EXPERIENCE">
          <RevealGroup as="ul" className="flex flex-col gap-3.5">
            {WORK_META.map((entry) => (
              <RevealItem as="li" className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1" key={entry.slug}>
                <span className="w-[170px] shrink-0 font-mono text-[15px] font-semibold text-ink">{entry.company}</span>
                <span className="shrink-0 font-sans text-[15px] text-ink-soft">{entry.role}</span>
                <span aria-hidden className="hidden leader sm:block" />
                {/*
                  Fixed lane plus nowrap: the compressed range is wide enough to
                  break onto a second line at some viewports, which pulls the
                  year rail out of alignment with the rows above it.
                */}
                <span className="shrink-0 font-mono text-[13px] whitespace-nowrap text-ink-soft">
                  {compressWorkPeriod(entry.period)}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </CvSection>

        <CvSection label="EDUCATION">
          <p className="font-sans text-base/relaxed text-ink-soft">{EDUCATION}</p>
        </CvSection>

        <CvSection label="LANGUAGES">
          <p className="font-sans text-base/relaxed text-ink-soft">{resume.skills.spokenLanguages.join(", ")}.</p>
        </CvSection>
      </div>
    </LedgerPage>
  );
}

/** A ruled row of the printed resume: label lane on the left, content on the right. */
function CvSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Reveal className="flex flex-col gap-3 border-b rule-hair py-7 sm:flex-row sm:gap-11">
      <p className="pt-1 font-mono text-[11px] tracking-[0.22em] text-label sm:w-[150px] sm:shrink-0">{label}</p>
      <div className="min-w-0 flex-1">{children}</div>
    </Reveal>
  );
}
