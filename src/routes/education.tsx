import { ContentPage } from "#/components/content/content-page";
import { EDUCATION_META } from "#/lib/content/page-meta";
import { EDUCATION_SOURCES } from "#/lib/content/registry";
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

function EducationPage() {
  const education = Route.useLoaderData();

  return (
    <ContentPage
      eyebrow="Education"
      title="Education"
      intro="Where Lucien studied - formal degrees, bootcamps, and continuing education."
      sources={EDUCATION_SOURCES}
      footer={
        <ul className="space-y-5 text-sm">
          {education.map((entry, index) => (
            <li key={`${entry.school}-${index}`}>
              <p className="font-medium text-neutral-950">{entry.degree}</p>
              <p className="text-xs text-neutral-600">
                {entry.school} · {entry.location}
              </p>
              <p className="text-xs text-neutral-500">
                {entry.start === entry.end ? entry.start : `${entry.start} – ${entry.end}`}
              </p>
              {entry.note ? <p className="mt-1 text-xs text-neutral-500">{entry.note}</p> : null}
            </li>
          ))}
        </ul>
      }
    />
  );
}
