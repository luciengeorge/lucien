import { z } from "zod";

const PersonalSchema = z.object({
  email: z.string().email(),
  links: z.object({
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }),
  location: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1).optional(),
  title: z.string().min(1),
  website: z.string().url().optional(),
});

const RoleSchema = z.object({
  bullets: z.array(z.string().min(1)),
  employmentType: z.string().min(1).optional(),
  end: z.string().nullable(),
  location: z.string().min(1).optional(),
  role: z.string().min(1),
  start: z.string().min(1),
});

const ExperienceSchema = z.object({
  color: z.string().min(1).optional(),
  company: z.string().min(1),
  logo: z.string().min(1).nullable().optional(),
  roles: z.array(RoleSchema).min(1),
  website: z.string().url().nullable().optional(),
});

const EducationSchema = z.object({
  degree: z.string().min(1),
  end: z.string().min(1),
  location: z.string().min(1),
  note: z.string().nullable().optional(),
  school: z.string().min(1),
  start: z.string().min(1),
});

const SkillsSchema = z.object({
  programming: z.array(z.string().min(1)),
  spokenLanguages: z.array(z.string().min(1)),
});

export const ResumeSchema = z.object({
  education: z.array(EducationSchema),
  experiences: z.array(ExperienceSchema),
  personal: PersonalSchema,
  skills: SkillsSchema,
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeExperience = z.infer<typeof ExperienceSchema>;
export type ResumeRole = z.infer<typeof RoleSchema>;
export type ResumeEducation = z.infer<typeof EducationSchema>;
