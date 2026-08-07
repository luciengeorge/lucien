import { MigrationRoute } from "#/components/field-notes/illustrations/migration-route";
import { JournalPage, MarginNote, MarginVoice, PageHeader, Section } from "#/components/field-notes/journal-page";
import { Reveal, RevealGroup, RevealItem } from "#/components/field-notes/reveal";
import { ABOUT_META } from "#/lib/content/page-meta";
import { buildSeoHead } from "#/lib/seo";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

const { title: TITLE, description: DESCRIPTION } = ABOUT_META;
const URL = `${SITE_URL}/about`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: URL,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: { "@type": "Person", name: "Lucien George" },
};

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () =>
    buildSeoHead({
      title: TITLE,
      description: DESCRIPTION,
      url: URL,
      type: "profile",
      jsonLd: [structuredData],
      markdownUrl: `${URL}.md`,
    }),
});

const BEHAVIOURS = [
  {
    label: "ENDURANCE",
    note: "Alpe d'Huez triathlon, a half Ironman in Nice, a marathon in Florence. Recently took up cycling and has signed up for a 24-hour triathlon in France, October 2026.",
  },
  {
    label: "SNOW",
    note: "Grew up skiing in Lebanon. Competed on the Lebanese national ski teams.",
  },
  {
    label: "MOTORSPORT",
    note: "Competes in the IAME karting championship at Le Mans.",
  },
  {
    label: "AT REST",
    note: "Dogs, hiking, travelling, and time with family.",
  },
];

export function AboutPage() {
  return (
    <JournalPage
      margin={
        <>
          <MarginNote label="CALL">French, English, Arabic.</MarginNote>
          <MarginNote label="CLUTCH">Second eldest of four. Very family-oriented.</MarginNote>
          <MarginNote label="FIRST RECORDED">
            <span className="text-pen">Beirut. Migrated to Montreal, then London in 2018.</span>
          </MarginNote>
          <div className="flex flex-col gap-4">
            <MigrationRoute />
            <MarginVoice>Migration route, three stops, still moving.</MarginVoice>
          </div>
        </>
      }
    >
      {/*
        The h1 keeps his name rather than a bare "About": it is the page's
        strongest on-page signal and this domain is young, so the design word
        goes in the meta line above instead.
      */}
      <PageHeader meta="observation 01 · the subject" title="About Lucien George" />

      <Reveal className="flex max-w-[880px] flex-col gap-6" delay={0.08}>
        <p className="font-display text-xl/relaxed text-ink">
          Fullstack developer and product engineer in London, originally from Beirut. Senior Product Engineer at Fyxer,
          where he leads the notetaker with one other developer, a team of two running the feature like they own it.
        </p>
        <p className="font-display text-xl/relaxed text-ink-soft">
          His background spans teaching, engineering leadership and product development, across web, mobile, desktop and
          real-time systems. He works across user research, data analysis, roadmaps and building the thing end to end,
          which is a longer way of saying he would rather own the whole problem than a slice of it.
        </p>
      </Reveal>

      <Section title="BEHAVIOUR IN THE WILD">
        <RevealGroup as="ul" className="flex flex-col gap-7">
          {BEHAVIOURS.map((behaviour) => (
            <RevealItem as="li" className="flex flex-col gap-2 sm:flex-row sm:gap-8" key={behaviour.label}>
              <p className="w-[96px] shrink-0 font-mono text-[11px] tracking-[0.14em] text-rust">{behaviour.label}</p>
              <p className="max-w-[760px] font-display text-lg/relaxed text-ink">{behaviour.note}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>
    </JournalPage>
  );
}
