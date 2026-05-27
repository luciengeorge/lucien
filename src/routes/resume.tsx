import type { ResumeRole } from "#/lib/resume/schema";

import { CompanyLogo } from "#/components/resume/company-logo";
import { buttonVariants } from "#/components/ui/button";
import { formatExperienceDuration, formatPeriod, loadResume } from "#/lib/resume/load";
import { cn } from "#/lib/utils";
import { Download01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resume")({
  component: ResumePage,
  head: () => ({
    meta: [
      { title: "Lucien George — Resume" },
      {
        content: "Resume for Lucien George — Senior Product Engineer at Fyxer.",
        name: "description",
      },
    ],
  }),
  loader: () => loadResume(),
});

function ResumePage() {
  const resume = Route.useLoaderData();
  const { education, experiences, personal, skills } = resume;
  const contactLine = [personal.phone, personal.email, personal.location].filter(Boolean).join(" · ");

  return (
    <div className="min-h-0 grow overflow-y-auto">
      <article className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10 sm:py-16">
        <header className="flex flex-col gap-6 border-b border-neutral-950/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{personal.name}</h1>
            <p className="mt-1 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase sm:text-sm">
              {personal.title}
            </p>
            <p className="mt-3 text-sm text-neutral-600">{contactLine}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
              {personal.links.github ? (
                <a
                  className="hover:text-neutral-950 hover:underline"
                  href={personal.links.github}
                  rel="noopener"
                  target="_blank"
                >
                  GitHub
                </a>
              ) : null}
              {personal.links.linkedin ? (
                <a
                  className="hover:text-neutral-950 hover:underline"
                  href={personal.links.linkedin}
                  rel="noopener"
                  target="_blank"
                >
                  LinkedIn
                </a>
              ) : null}
              {personal.website ? (
                <a
                  className="hover:text-neutral-950 hover:underline"
                  href={personal.website}
                  rel="noopener"
                  target="_blank"
                >
                  {personal.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
            </div>
          </div>

          <a
            className={cn(
              buttonVariants({ size: "default", variant: "default" }),
              "shrink-0 rounded-full print:hidden",
            )}
            download="lucien-george-resume.pdf"
            href="/api/resume/pdf"
            rel="noopener"
            target="_blank"
          >
            <HugeiconsIcon icon={Download01Icon} size={16} />
            Download PDF
          </a>
        </header>

        <div className="mt-10 grid gap-10 sm:grid-cols-[210px_1fr]">
          <aside className="space-y-8 text-sm">
            <section>
              <h2 className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Education</h2>
              <ul className="space-y-4">
                {education.map((item, index) => (
                  <li key={`${item.school}-${index}`}>
                    <p className="font-medium text-neutral-950">{item.degree}</p>
                    <p className="text-xs text-neutral-600">
                      {item.school} · {item.location}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.start === item.end ? item.start : `${item.start} – ${item.end}`}
                    </p>
                    {item.note ? <p className="mt-1 text-xs text-neutral-500">{item.note}</p> : null}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Programming</h2>
              <ul className="flex flex-wrap gap-1.5">
                {skills.programming.map((skill) => (
                  <li key={skill} className="rounded-md bg-neutral-950/5 px-2 py-0.5 text-xs text-neutral-700">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Languages</h2>
              <ul className="flex flex-wrap gap-1.5">
                {skills.spokenLanguages.map((language) => (
                  <li key={language} className="rounded-md bg-neutral-950/5 px-2 py-0.5 text-xs text-neutral-700">
                    {language}
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <section>
            <h2 className="mb-5 font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">Experience</h2>
            <ol className="relative">
              {experiences.map((experience, index) => {
                const isLast = index === experiences.length - 1;
                return (
                  <li key={`${experience.company}-${index}`} className={cn("relative pl-14", isLast ? "pb-0" : "pb-8")}>
                    {!isLast ? (
                      <span aria-hidden="true" className="absolute top-10 bottom-0 left-[19px] w-px bg-neutral-300" />
                    ) : null}
                    <CompanyLogo
                      className="absolute top-0 left-0 size-10 text-sm"
                      color={experience.color}
                      company={experience.company}
                      logo={experience.logo}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      {experience.website ? (
                        <a
                          className="text-base font-semibold text-neutral-950 hover:underline"
                          href={experience.website}
                          rel="noopener"
                          target="_blank"
                        >
                          {experience.company}
                        </a>
                      ) : (
                        <p className="text-base font-semibold text-neutral-950">{experience.company}</p>
                      )}
                      <p className="text-xs text-neutral-500">{formatExperienceDuration(experience)}</p>
                    </div>

                    <ul className="mt-3 space-y-4">
                      {experience.roles.map((role, roleIndex) => (
                        <li key={roleIndex}>
                          <RoleBlock role={role} />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </article>
    </div>
  );
}

function RoleBlock({ role }: { role: ResumeRole }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-sm text-neutral-800">
          {role.role}
          {role.employmentType ? <span className="text-neutral-500"> · {role.employmentType}</span> : null}
        </p>
        <p className="text-xs text-neutral-500">{formatPeriod(role.start, role.end)}</p>
      </div>
      <ul className="mt-1.5 space-y-1 text-sm text-neutral-600">
        {role.bullets.map((bullet, bulletIndex) => (
          <li key={bulletIndex} className="flex gap-2">
            <span aria-hidden="true" className="text-neutral-400">
              •
            </span>
            <span className="grow">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
