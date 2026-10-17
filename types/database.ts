// types/database.ts

/**
 * Core database schema definitions for the Jobbers project.
 * These interfaces are used throughout the codebase for type‑safe MongoDB access.
 */

export interface Profile {
  _id?: string; // ObjectId serialized to string
  userId: string; // matches Auth.js user id
  fullName: string;
  headline?: string;
  location?: string;
  email: string;
  hashedPassword: string; // bcrypt hash
  skills: string[];
  experience: Array<{
    id: string;
    role: string;
    company: string;
    startDate: string; // ISO date string
    endDate?: string; // ISO date string
    bullets: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    url?: string;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    year: string;
  }>;
  emailNotifications: boolean;
  updatedAt: string; // ISO date string
}

export interface Application {
  _id?: string;
  userId: string;
  externalJobId: string;
  stage: "Saved" | "Applied" | "Interview" | "Offer";
  role: string;
  company: string;
  location?: string;
  remoteType?: string;
  salaryLabel?: string;
  applyUrl?: string;
  descriptionSnippet?: string;
  matchScore: number; // 0‑100 deterministic score
  matchedSkills: string[];
  missingSkills: string[];
  fitJustification?: string;
  resumeId?: string;
  notes?: string;
  appliedAt?: string; // ISO date string
  updatedAt: string;
  createdAt: string;
}

export interface Resume {
  _id?: string;
  userId: string;
  targetJobId?: string;
  title: string;
  targetCompany?: string;
  targetRole?: string;
  tailoredSummary: string;
  selectedSkills: string[];
  tailoredExperience: string;
  tailoredProjects: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dossier {
  _id?: string;
  companySlug: string; // unique identifier
  companyName: string;
  website?: string;
  overview?: string;
  cultureNotes: string[];
  techStack: string[];
  interviewProcess: string[];
  talkingPoints: string[];
  updatedAt: string;
}

// Union type for generic collection usage if needed
export type AnyDocument = Profile | Application | Resume | Dossier;
