import type { ReactNode } from "react";

import { FrequencyPlot } from "#/components/ledger/illustrations/frequency-plot";
import { LedgerPage, PageHeader, RailAside, RailNote } from "#/components/ledger/ledger-page";
import { RevealGroup, RevealItem } from "#/components/motion-primitives/reveal";
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

/**
 * A published package is a name reaching across to where it lives, which is
 * the one shape on this page that earns a leader. The rest of the rows are
 * prose and get none.
 */
function PackageRow({ name }: { name: string }) {
  return (
    <a
      className="group flex items-baseline gap-3.5"
      href={`https://www.npmjs.com/package/${name}`}
      rel="noreferrer"
      target="_blank"
    >
      <span className="shrink-0 font-mono text-[15px] text-ink transition-colors group-hover:text-stamp">{name}</span>
      <span aria-hidden className="leader" />
      <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-label">NPM</span>
      <span
        aria-hidden
        className="w-4 shrink-0 text-right font-mono text-[15px] text-stamp transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  );
}

/*
 * PRIMARY and ALSO FLUENT are statements rather than prose, so they carry the
 * display scale. Everything below them is body copy and stays in Geist, which
 * is what keeps the page from reading as a stack of headlines.
 */
const GROUPS: Group[] = [
  {
    label: "PRIMARY",
    content: (
      <span className="font-mono text-xl font-semibold tracking-[-0.01em] text-ink sm:text-2xl">
        TypeScript, JavaScript, React
      </span>
    ),
  },
  {
    label: "ALSO FLUENT",
    content: <span className="font-mono text-lg font-semibold text-ink">Ruby on Rails, Python</span>,
  },
  {
    label: "CURRENT STACK",
    content: (
      <span className="font-sans text-base/relaxed text-ink">
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
      <span className="flex flex-col gap-2.5">
        {PACKAGES.map((name) => (
          <PackageRow key={name} name={name} />
        ))}
      </span>
    ),
  },
  {
    label: "CURRENTLY TRACKING",
    content: (
      <span className="font-sans text-base/relaxed text-ink">
        AI application development. OpenAI APIs, TanStack AI, and RAG over Convex vector search. This page is the
        experiment.
      </span>
    ),
  },
];

export function SkillsPage() {
  return (
    <LedgerPage
      rail={
        <>
          <RailNote label="HOW OFTEN">
            <FrequencyPlot className="pt-1" />
          </RailNote>
          <RailAside>Measured by what he opened this year, not by what looks best on a list.</RailAside>
        </>
      }
    >
      <PageHeader label="SKILLS" title="What Lucien works in">
        <p className="max-w-[41rem] font-sans text-[17px]/relaxed text-ink-soft">
          Listed by how often it shows up in the work, not by how well he scores it.
        </p>
      </PageHeader>

      <RevealGroup as="ul" className="flex flex-col border-t rule-ink">
        {GROUPS.map((group) => (
          <RevealItem
            as="li"
            className="flex flex-col gap-2 border-b rule-hair py-6 lg:flex-row lg:gap-11"
            key={group.label}
          >
            <p className="pt-1.5 font-mono text-[11px] tracking-[0.22em] text-label lg:w-[150px] lg:shrink-0">
              {group.label}
            </p>
            <div className="min-w-0 flex-1 lg:max-w-[46rem]">{group.content}</div>
          </RevealItem>
        ))}
      </RevealGroup>
    </LedgerPage>
  );
}
