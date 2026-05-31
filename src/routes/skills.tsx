import { ContentPage } from "#/components/content/content-page";
import { SKILLS_SOURCES } from "#/lib/content/registry";
import { loadResume } from "#/lib/resume/load";
import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://www.luciengeorge.com";
const TITLE = "Lucien George — Tech stack & skills";
const DESCRIPTION =
  "Lucien George's tech stack: TypeScript, React, the TanStack ecosystem, Convex, Tailwind, Electron, Ruby on Rails, Python, native iOS/Android.";
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
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:url", content: URL },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: TITLE },
        { name: "twitter:description", content: DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData(programming)),
        },
      ],
    };
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
