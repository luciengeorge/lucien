import type { Resume, ResumeExperience, ResumeRole } from "./schema";

/**
 * Deterministic markdown serializer for the zod-validated resume data,
 * mirroring the section order of the HTML resume page (personal header,
 * then Education, Skills, Experience). Returns the body only - no leading
 * H1 - since `buildMarkdownPage` supplies the page's own `# <title>`.
 */
export function renderResumeMarkdown(resume: Resume): string {
  const sections = [renderPersonal(resume), renderEducation(resume), renderSkills(resume), renderExperience(resume)];
  return sections.join("\n\n");
}

function renderPersonal(resume: Resume): string {
  const { personal } = resume;
  const lines = [`**${personal.name}** - ${personal.title} · ${personal.location}`];

  const contact = [personal.email, personal.phone].filter((value): value is string => Boolean(value));
  lines.push(contact.join(" · "));

  const links = [
    personal.links.github ? `GitHub: ${personal.links.github}` : null,
    personal.links.linkedin ? `LinkedIn: ${personal.links.linkedin}` : null,
    personal.website ? `Website: ${personal.website}` : null,
  ].filter((value): value is string => Boolean(value));
  if (links.length > 0) lines.push(links.join(" · "));

  return lines.join("\n");
}

function renderEducation(resume: Resume): string {
  const lines = ["## Education", ""];
  for (const entry of resume.education) {
    const period = entry.start === entry.end ? entry.start : `${entry.start} - ${entry.end}`;
    const noteSuffix = entry.note ? ` ${entry.note}` : "";
    lines.push(`- **${entry.degree}** - ${entry.school}, ${entry.location} (${period}).${noteSuffix}`);
  }
  return lines.join("\n");
}

function renderSkills(resume: Resume): string {
  return [
    "## Skills",
    "",
    `Programming: ${resume.skills.programming.join(", ")}`,
    `Spoken languages: ${resume.skills.spokenLanguages.join(", ")}`,
  ].join("\n");
}

function renderExperience(resume: Resume): string {
  const lines = ["## Experience", ""];
  for (const experience of resume.experiences) {
    lines.push(renderExperienceEntry(experience));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderExperienceEntry(experience: ResumeExperience): string {
  const heading = experience.website
    ? `### ${experience.company} (${experience.website})`
    : `### ${experience.company}`;
  const roleLines = experience.roles.flatMap((role) => renderRole(role));
  return [heading, ...roleLines].join("\n");
}

function renderRole(role: ResumeRole): string[] {
  const period = `${role.start} - ${role.end ?? "Present"}`;
  const typeSuffix = role.employmentType ? ` · ${role.employmentType}` : "";
  const lines = [`**${role.role}**${typeSuffix} · ${period}`];
  for (const bullet of role.bullets) lines.push(`- ${bullet}`);
  return lines;
}
