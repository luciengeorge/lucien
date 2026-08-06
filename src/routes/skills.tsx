import { ContentPage } from "#/components/content/content-page";
import { SKILLS_META } from "#/lib/content/page-meta";
import { SKILLS_SOURCES } from "#/lib/content/registry";
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

function SkillsPage() {
  const skills = Route.useLoaderData();

  return (
    <ContentPage
      eyebrow="Tech stack"
      title="Skills"
      intro="Languages, frameworks, and tools Lucien uses today and has used in the past."
      sources={SKILLS_SOURCES}
      footer={
        <div className="space-y-6 text-sm text-neutral-700">
          <section>
            <h2 className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Languages</h2>
            <ul className="flex flex-wrap gap-1.5">
              {skills.programming.map((skill) => (
                <li key={skill} className="rounded-md bg-neutral-950/5 px-2 py-0.5 text-xs text-neutral-700">
                  {skill}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Spoken</h2>
            <ul className="flex flex-wrap gap-1.5">
              {skills.spokenLanguages.map((language) => (
                <li key={language} className="rounded-md bg-neutral-950/5 px-2 py-0.5 text-xs text-neutral-700">
                  {language}
                </li>
              ))}
            </ul>
          </section>
        </div>
      }
    />
  );
}
