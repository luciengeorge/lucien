import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Resume, ResumeExperience, ResumeRole } from "./schema";

import { companyInitials, formatExperienceDuration, formatPeriod } from "./load";

const COLORS = {
  accent: "#0f172a",
  border: "#d4d4d8",
  muted: "#4b5563",
  subtle: "#6b7280",
  text: "#1c1c1c",
  timeline: "#9ca3af",
};

const styles = StyleSheet.create({
  bullet: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 1.4,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletText: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  column: {
    flexDirection: "column",
  },
  companyName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 500,
  },
  educationDegree: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 500,
  },
  educationItem: {
    marginBottom: 3,
  },
  educationMeta: {
    color: COLORS.muted,
    fontSize: 8.5,
    marginTop: 1,
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
  experienceDuration: {
    color: COLORS.subtle,
    fontSize: 9,
  },
  experienceItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
    position: "relative",
  },
  footerRow: {
    borderTopColor: COLORS.border,
    borderTopWidth: 0.6,
    flexDirection: "row",
    gap: 20,
    marginTop: 2,
    paddingTop: 8,
  },
  header: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0.6,
    marginBottom: 10,
    paddingBottom: 9,
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
    fontSize: 9.5,
    paddingHorizontal: 40,
    paddingVertical: 28,
  },
  pill: {
    backgroundColor: "#f4f4f5",
    borderRadius: 3,
    color: COLORS.text,
    fontSize: 8,
    marginBottom: 3,
    marginRight: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pillGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  roleEntry: {
    marginTop: 4,
  },
  roleHeaderRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2.5,
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
  sectionHeading: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1.5,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  timelineLine: {
    backgroundColor: COLORS.timeline,
    bottom: -6,
    left: 13.5,
    position: "absolute",
    top: 28,
    width: 0.6,
  },
});

function CompanyLogo({ color, company, logoUrl }: { color?: string; company: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return <Image src={logoUrl} style={styles.logoImage} />;
  }

  return (
    <View style={[styles.logo, { backgroundColor: color ?? COLORS.accent }]}>
      <Text>{companyInitials(company)}</Text>
    </View>
  );
}

function buildLogoUrl(baseUrl: string, logo: string | null | undefined) {
  if (!logo) return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  return `${baseUrl}${logo.startsWith("/") ? logo : `/${logo}`}`;
}

function RolePdfBlock({ isFirst, role }: { isFirst: boolean; role: ResumeRole }) {
  return (
    <View style={isFirst ? undefined : styles.roleEntry}>
      <View style={styles.roleHeaderRow}>
        <Text style={styles.roleTitle}>
          {role.role}
          {role.employmentType ? <Text style={styles.roleType}> · {role.employmentType}</Text> : null}
        </Text>
        <Text style={styles.rolePeriod}>{formatPeriod(role.start, role.end)}</Text>
      </View>
      {role.bullets.map((bullet, bulletIndex) => (
        <View key={bulletIndex} style={styles.bulletRow}>
          <Text style={styles.bullet}>• </Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
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
          <Text style={styles.experienceDuration}>{formatExperienceDuration(experience)}</Text>
        </View>
        {experience.roles.map((role, roleIndex) => (
          <RolePdfBlock key={roleIndex} isFirst={roleIndex === 0} role={role} />
        ))}
      </View>
    </View>
  );
}

export function ResumeDocument({ baseUrl, resume }: { baseUrl: string; resume: Resume }) {
  const { education, experiences, personal, skills } = resume;
  const contactLine = [personal.phone, personal.email, personal.location].filter(Boolean).join(" · ");

  return (
    <Document author={personal.name} subject="Resume" title={`${personal.name} - Resume`}>
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

        <View style={styles.column}>
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

        <View style={styles.footerRow}>
          <View style={[styles.column, { flex: 1.5 }]}>
            <Text style={styles.sectionHeading}>Education</Text>
            {education.map((item, index) => (
              <View key={`${item.school}-${index}`} style={styles.educationItem}>
                <Text style={styles.educationDegree}>{item.degree}</Text>
                <Text style={styles.educationMeta}>
                  {item.school} · {item.location} · {item.start === item.end ? item.start : `${item.start}-${item.end}`}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.column, { flex: 1.15 }]}>
            <Text style={styles.sectionHeading}>Programming</Text>
            <View style={styles.pillGroup}>
              {skills.programming.map((skill) => (
                <Text key={skill} style={styles.pill}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>

          <View style={[styles.column, { flex: 0.55 }]}>
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
      </Page>
    </Document>
  );
}
