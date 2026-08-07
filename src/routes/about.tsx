import { AsideNote, AsideVoice, CedarPage, PageHeader, Section } from "#/components/cedar/cedar-page";
import { MigrationRoute } from "#/components/cedar/illustrations/migration-route";
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

const PURSUITS = [
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
    <CedarPage
      aside={
        <>
          <AsideNote label="LANGUAGES">French, English, Arabic.</AsideNote>
          <AsideNote label="FAMILY">Second eldest of four. Very family-oriented.</AsideNote>
          <AsideNote label="ROUTE">Beirut. Migrated to Montreal, then London in 2018.</AsideNote>
          <div className="flex flex-col gap-4">
            <MigrationRoute />
            <AsideVoice>Migration route, three stops, still moving.</AsideVoice>
          </div>
        </>
      }
    >
      {/*
        The h1 keeps his name rather than a bare "About": it is the page's
        strongest on-page signal and this domain is young, so the design word
        goes in the lead-in above instead.
      */}
      <PageHeader leadIn="made in" title="About Lucien George" />

      <Reveal className="flex max-w-[760px] flex-col gap-5" delay={0.08}>
        <p className="font-sans text-lg/relaxed text-ink">
          Fullstack developer and product engineer in London, originally from Beirut. Senior Product Engineer at Fyxer,
          where he leads the notetaker with one other developer, a team of two running the feature like they own it.
        </p>
        <p className="font-sans text-lg/relaxed text-ink-soft">
          His background spans teaching, engineering leadership and product development, across web, mobile, desktop and
          real-time systems. He works across user research, data analysis, roadmaps and building the thing end to end,
          which is a longer way of saying he would rather own the whole problem than a slice of it.
        </p>
      </Reveal>

      <Section title="HOW HE SPENDS HIS TIME">
        <RevealGroup as="ul" className="flex flex-col gap-6">
          {PURSUITS.map((pursuit) => (
            <RevealItem as="li" className="flex flex-col gap-1.5 sm:flex-row sm:gap-8" key={pursuit.label}>
              <p className="w-[104px] shrink-0 pt-1 font-mono text-[11px] tracking-[0.14em] text-cedar">
                {pursuit.label}
              </p>
              <p className="max-w-[680px] font-sans text-base/relaxed text-ink-soft">{pursuit.note}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>
    </CedarPage>
  );
}
