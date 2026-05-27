import type { Resume, ResumeExperience } from "./schema";

import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatExperienceSpan, formatPeriod } from "./load";

const COLORS = {
  accent: "#0f172a",
  border: "#e5e5e5",
  muted: "#6b7280",
  subtle: "#9ca3af",
  text: "#1c1c1c",
  timeline: "#d4d4d8",
};

const styles = StyleSheet.create({
  bullet: {
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 1.45,
    marginBottom: 1.5,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletText: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  column: {
    flexDirection: "column",
  },
  companyName: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: 500,
  },
  educationDegree: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 500,
  },
  educationItem: {
    marginBottom: 10,
  },
  educationMeta: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 1,
  },
  educationNote: {
    color: COLORS.subtle,
    fontSize: 8.5,
    lineHeight: 1.4,
    marginTop: 3,
  },
  experienceBody: {
    flex: 1,
    paddingTop: 1,
  },
  experienceCompanyRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  experienceItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    position: "relative",
  },
  experiencePeriod: {
    color: COLORS.subtle,
    fontSize: 9,
  },
  header: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    marginBottom: 18,
    paddingBottom: 12,
  },
  headerContact: {
    color: COLORS.muted,
    flexDirection: "row",
    fontSize: 9,
    gap: 10,
    marginTop: 6,
  },
  headerContactItem: {
    color: COLORS.muted,
    fontSize: 9,
  },
  headerLink: {
    color: COLORS.muted,
    fontSize: 9,
    textDecoration: "none",
  },
  headerName: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 1.4,
    marginTop: 3,
    textTransform: "uppercase",
  },
  logo: {
    alignItems: "center",
    borderRadius: 14,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 600,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  logoColumn: {
    alignItems: "center",
    width: 28,
  },
  logoImage: {
    borderRadius: 14,
    height: 28,
    objectFit: "cover",
    width: 28,
  },
  page: {
    backgroundColor: "#ffffff",
    color: COLORS.text,
    flexDirection: "column",
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingHorizontal: 40,
    paddingVertical: 36,
  },
  pill: {
    backgroundColor: "#f4f4f5",
    borderRadius: 3,
    color: COLORS.text,
    fontSize: 8.5,
    marginBottom: 4,
    marginRight: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  roleEntry: {
    marginTop: 6,
    paddingLeft: 0,
  },
  roleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rolePeriod: {
    color: COLORS.subtle,
    fontSize: 9,
  },
  roleTitle: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 500,
  },
  roleType: {
    color: COLORS.subtle,
    fontWeight: 400,
  },
  row: {
    flexDirection: "row",
    gap: 28,
  },
  sectionHeading: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1.6,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  sidebar: {
    flexDirection: "column",
    width: 175,
  },
  sidebarBlock: {
    marginBottom: 18,
  },
  subDot: {
    backgroundColor: COLORS.timeline,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  subDotColumn: {
    alignItems: "center",
    paddingTop: 5,
    width: 28,
  },
  timelineLine: {
    backgroundColor: COLORS.timeline,
    bottom: -14,
    left: 13,
    position: "absolute",
    top: 28,
    width: 1.5,
  },
});

function initials(company: string) {
  return company
    .split(/\s+/)
    .map((word) => word[0])
    ?.slice(0, 2)
    .join("")
    .toUpperCase();
}

function CompanyLogo({ color, company, logoUrl }: { color?: string; company: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return <Image src={logoUrl} style={styles.logoImage} />;
  }

  return (
    <View style={[styles.logo, { backgroundColor: color ?? COLORS.accent }]}>
      <Text>{initials(company)}</Text>
    </View>
  );
}

function buildLogoUrl(baseUrl: string, logo: string | null | undefined) {
  if (!logo) return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  return `${baseUrl}${logo.startsWith("/") ? logo : `/${logo}`}`;
}

function ExperienceBlock({
  baseUrl,
  experience,
  isLast,
}: {
  baseUrl: string;
  experience: ResumeExperience;
  isLast: boolean;
}) {
  const [firstRole, ...otherRoles] = experience.roles;

  return (
    <View style={styles.experienceItem}>
      {!isLast ? <View style={styles.timelineLine} /> : null}
      <View style={styles.logoColumn}>
        <CompanyLogo
          color={experience.color}
          company={experience.company}
          logoUrl={buildLogoUrl(baseUrl, experience.logo)}
        />
      </View>
      <View style={styles.experienceBody}>
        <View style={styles.experienceCompanyRow}>
          <Text style={styles.companyName}>{experience.company}</Text>
          <Text style={styles.experiencePeriod}>{formatExperienceSpan(experience)}</Text>
        </View>

        {firstRole ? (
          <View>
            <View style={styles.roleHeaderRow}>
              <Text style={styles.roleTitle}>
                {firstRole.role}
                {firstRole.employmentType ? <Text style={styles.roleType}> · {firstRole.employmentType}</Text> : null}
              </Text>
              {experience.roles.length > 1 ? (
                <Text style={styles.rolePeriod}>{formatPeriod(firstRole.start, firstRole.end)}</Text>
              ) : null}
            </View>
            <View style={{ marginTop: 3 }}>
              {firstRole.bullets.map((bullet, bulletIndex) => (
                <View key={bulletIndex} style={styles.bulletRow}>
                  <Text style={styles.bullet}>• </Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {otherRoles.map((role, roleIndex) => (
          <View key={roleIndex} style={styles.roleEntry}>
            <View style={styles.roleHeaderRow}>
              <Text style={styles.roleTitle}>
                {role.role}
                {role.employmentType ? <Text style={styles.roleType}> · {role.employmentType}</Text> : null}
              </Text>
              <Text style={styles.rolePeriod}>{formatPeriod(role.start, role.end)}</Text>
            </View>
            <View style={{ marginTop: 3 }}>
              {role.bullets.map((bullet, bulletIndex) => (
                <View key={bulletIndex} style={styles.bulletRow}>
                  <Text style={styles.bullet}>• </Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ResumeDocument({ baseUrl, resume }: { baseUrl: string; resume: Resume }) {
  const { education, experiences, personal, skills } = resume;
  const contactLine = [personal.phone, personal.email, personal.location].filter(Boolean).join(" · ");

  return (
    <Document author={personal.name} subject="Resume" title={`${personal.name} – Resume`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerName}>{personal.name}</Text>
          <Text style={styles.headerTitle}>{personal.title}</Text>
          <View style={styles.headerContact}>
            <Text style={styles.headerContactItem}>{contactLine}</Text>
            {personal.links.github ? (
              <Link src={personal.links.github} style={styles.headerLink}>
                GitHub
              </Link>
            ) : null}
            {personal.links.linkedin ? (
              <Link src={personal.links.linkedin} style={styles.headerLink}>
                LinkedIn
              </Link>
            ) : null}
            {personal.website ? (
              <Link src={personal.website} style={styles.headerLink}>
                {personal.website.replace(/^https?:\/\//, "")}
              </Link>
            ) : null}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarBlock}>
              <Text style={styles.sectionHeading}>Education</Text>
              {education.map((item, index) => (
                <View key={`${item.school}-${index}`} style={styles.educationItem}>
                  <Text style={styles.educationDegree}>{item.degree}</Text>
                  <Text style={styles.educationMeta}>
                    {item.school} · {item.location}
                  </Text>
                  <Text style={styles.educationMeta}>
                    {item.start === item.end ? item.start : `${item.start} – ${item.end}`}
                  </Text>
                  {item.note ? <Text style={styles.educationNote}>{item.note}</Text> : null}
                </View>
              ))}
            </View>

            <View style={styles.sidebarBlock}>
              <Text style={styles.sectionHeading}>Programming</Text>
              <View style={styles.pillGroup}>
                {skills.programming.map((skill) => (
                  <Text key={skill} style={styles.pill}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.sidebarBlock}>
              <Text style={styles.sectionHeading}>Languages</Text>
              <View style={styles.pillGroup}>
                {skills.spokenLanguages.map((language) => (
                  <Text key={language} style={styles.pill}>
                    {language}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.column, { flex: 1 }]}>
            <Text style={styles.sectionHeading}>Experience</Text>
            {experiences.map((experience, index) => (
              <ExperienceBlock
                key={`${experience.company}-${index}`}
                baseUrl={baseUrl}
                experience={experience}
                isLast={index === experiences.length - 1}
              />
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
