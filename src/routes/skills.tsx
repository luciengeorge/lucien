import type { ReactNode } from "react";

import { FrequencyPlot } from "#/components/field-notes/illustrations/frequency-plot";
import { JournalPage, MarginNote, MarginVoice, PageHeader } from "#/components/field-notes/journal-page";
import { RevealGroup, RevealItem } from "#/components/field-notes/reveal";
import { SKILLS_META } from "#/lib/content/page-meta";
import { loadResume } from "#/lib/resume/load";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = SKILLS_META;
const URL = `${SITE_URL}/skills`;

const structuredData = (programming: string[]) => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: {
    "@type": "Person",
    name: "Lucien George",
    jobTitle: "Senior Product Engineer",
    knowsAbout: programming,
  },
});

export const Route = createFileRoute("/skills")({
  loader: () => loadResume().skills,
  component: SkillsPage,
  head: ({ loaderData }) => {
    const programming = loaderData?.programming ?? [];
    return buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "profile",
      jsonLd: [structuredData(programming)],
      markdownUrl: `${URL}.md`,
    });
  },
});

const PACKAGES = ["remix-auth-salesforce", "stimulus-lazy-loader", "stimulus-checkbox"];

interface FieldMark {
  content: ReactNode;
  label: string;
}

const FIELD_MARKS: FieldMark[] = [
  {
    label: "PRIMARY",
    content: <span className="font-display text-2xl text-ink italic">TypeScript, JavaScript, React</span>,
  },
  {
    label: "ALSO FLUENT",
    content: <span className="font-display text-xl text-ink">Ruby on Rails, Python</span>,
  },
  {
    label: "CURRENT STACK",
    content: (
      <span className="font-display text-lg/relaxed text-ink-soft">
        TanStack Start, Router, Query and Form. Tailwind with shadcn/ui. Convex for the backend, plus long experience
        with SQL.
      </span>
    ),
  },
  {
    label: "ALSO SEEN IN",
    content: (
      <span className="font-display text-lg/relaxed text-ink-soft">
        React Router and Remix, Next.js, and Electron for native desktop.
      </span>
    ),
  },
  {
    label: "MOBILE",
    content: (
      <span className="font-display text-lg/relaxed text-ink-soft">
        Native iOS in Swift, Android in Kotlin and Java, React Native. Built both native SDKs at Shopify.
      </span>
    ),
  },
  {
    label: "PUBLISHED",
    content: (
      <span className="font-display text-lg/relaxed text-ink-soft">
        {PACKAGES.map((name, index) => (
          <span key={name}>
            <a
              className="text-pen transition-colors hover:text-ink"
              href={`https://www.npmjs.com/package/${name}`}
              rel="noreferrer"
              target="_blank"
            >
              {name}
            </a>
            {index < PACKAGES.length - 1 ? ", " : "."}
          </span>
        ))}
      </span>
    ),
  },
  {
    label: "CURRENTLY TRACKING",
    content: (
      <span className="font-display text-lg/relaxed text-pen italic">
        AI application development. OpenAI APIs, TanStack AI, and RAG over Convex vector search. This page is the
        experiment.
      </span>
    ),
  },
];

export function SkillsPage() {
  return (
    <JournalPage
      margin={
        <>
          <MarginVoice>Listed by how often it shows up in the wild, not by how well he scores it.</MarginVoice>
          <MarginNote label="FREQUENCY OF SIGHTING">
            <FrequencyPlot />
          </MarginNote>
        </>
      }
    >
      <PageHeader meta="identification key · what to look for" title="Field marks" />

      <RevealGroup as="ul" className="flex max-w-[900px] flex-col">
        {FIELD_MARKS.map((mark) => (
          <RevealItem
            as="li"
            className="flex flex-col gap-2 border-t rule-dashed py-6 last:border-b lg:flex-row lg:gap-10"
            key={mark.label}
          >
            <p className="pt-1.5 font-mono text-[11px] tracking-[0.14em] text-rust lg:w-[170px] lg:shrink-0">
              {mark.label}
            </p>
            <div className="min-w-0 flex-1">{mark.content}</div>
          </RevealItem>
        ))}
      </RevealGroup>
    </JournalPage>
  );
}
