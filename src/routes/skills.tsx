import type { ReactNode } from "react";

import { AsideNote, AsideVoice, CedarPage, PageHeader } from "#/components/cedar/cedar-page";
import { FrequencyPlot } from "#/components/cedar/illustrations/frequency-plot";
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

interface Group {
  content: ReactNode;
  label: string;
}

/*
 * PRIMARY and ALSO FLUENT are statements rather than prose, so they carry
 * Fraunces at display scale. Everything below them is body copy and stays in
 * Geist, which is what keeps the page from reading as a set of headlines.
 */
const GROUPS: Group[] = [
  {
    label: "PRIMARY",
    content: <span className="font-display text-3xl font-semibold text-ink">TypeScript, JavaScript, React</span>,
  },
  {
    label: "ALSO FLUENT",
    content: <span className="font-display text-xl font-semibold text-ink">Ruby on Rails, Python</span>,
  },
  {
    label: "CURRENT STACK",
    content: (
      <span className="font-sans text-base/relaxed text-ink-soft">
        TanStack Start, Router, Query and Form. Tailwind with shadcn/ui. Convex for the backend, plus long experience
        with SQL.
      </span>
    ),
  },
  {
    label: "ALSO SEEN IN",
    content: (
      <span className="font-sans text-base/relaxed text-ink-soft">
        React Router and Remix, Next.js, and Electron for native desktop.
      </span>
    ),
  },
  {
    label: "MOBILE",
    content: (
      <span className="font-sans text-base/relaxed text-ink-soft">
        Native iOS in Swift, Android in Kotlin and Java, React Native. Built both native SDKs at Shopify.
      </span>
    ),
  },
  {
    label: "PUBLISHED",
    content: (
      <span className="font-sans text-base/relaxed text-ink-soft">
        {PACKAGES.map((name, index) => (
          <span key={name}>
            <a
              className="text-cedar underline decoration-cedar/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/40"
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
      <span className="font-sans text-base/relaxed text-ink-soft">
        AI application development. OpenAI APIs, TanStack AI, and RAG over Convex vector search. This page is the
        experiment.
      </span>
    ),
  },
];

export function SkillsPage() {
  return (
    <CedarPage
      aside={
        <>
          <AsideVoice>Listed by how often it shows up in the work, not by how well he scores it.</AsideVoice>
          <AsideNote label="HOW OFTEN">
            <FrequencyPlot />
          </AsideNote>
        </>
      }
    >
      <PageHeader leadIn="works in" title="Craft" />

      <RevealGroup as="ul" className="flex max-w-[860px] flex-col">
        {GROUPS.map((group) => (
          <RevealItem
            as="li"
            className="flex flex-col gap-2 border-t rule-stone py-6 last:border-b lg:flex-row lg:gap-10"
            key={group.label}
          >
            <p className="pt-2 font-mono text-[11px] tracking-[0.14em] text-cedar lg:w-[170px] lg:shrink-0">
              {group.label}
            </p>
            <div className="min-w-0 flex-1">{group.content}</div>
          </RevealItem>
        ))}
      </RevealGroup>
    </CedarPage>
  );
}
