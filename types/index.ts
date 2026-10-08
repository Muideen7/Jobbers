import type {
  ApplicationEventType,
  ApplicationStatus,
  ClosedReason,
} from "@/lib/workspace/constants";
import type { JobSourceId } from "@/lib/jobs/types";

export type MissingField =
  | "FULL NAME"
  | "PHONE"
  | "LOCATION"
  | "JOB TITLE"
  | "EXPERIENCE LEVEL"
  | "YEARS EXP"
  | "SKILLS"
  | "WORK EXPERIENCE"
  | "EDUCATION";

export type ResumeKind = "uploaded" | "generated";

export interface Resume {
  id: string;
  user_id: string;
  name: string;
  kind: ResumeKind;
  target_role: string | null;
  target_company: string | null;
  template: "classic" | "modern" | "minimal" | null;
  storage_path: string | null;
  file_size: number | null;
  content: Record<string, any> | null;
  is_primary: boolean;
  source_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperience[] | null;
  education: Education | null;
  job_titles_seeking: string[];
  remote_preference: string | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  resume_pdf_url: string | null;
  linkedin_context_id: string | null;
  linkedin_connected: boolean;
  is_complete: boolean;
  /** Last time the user opened /jobs (Prompt 2); null = never visited. */
  last_jobs_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  responsibilities: string;
}

export interface Education {
  degree: string | null;
  field: string | null;
  institution: string | null;
  graduation_year: string | null;
}

export interface AgentRun {
  id: string;
  user_id: string;
  status: "running" | "completed" | "failed";
  job_title_searched: string | null;
  location_searched: string | null;
  jobs_found: number;
  started_at: string;
  completed_at: string | null;
}

export interface Job {
  id: string;
  run_id: string | null;
  user_id: string;
  /**
   * Provenance: "url" for hand-saved listings, a provider id for jobs found
   * via the multi-source search, and legacy "search" for pre-A7 rows (all
   * Adzuna). The attribution line credits these (lib/source-attribution.ts).
   */
  source: "search" | "url" | JobSourceId;
  source_url: string | null;
  external_apply_url: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  about_role: string | null;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string | null;
  match_score: number | null;
  match_reason: string | null;
  matched_skills: string[];
  missing_skills: string[];
  cover_letter: string | null;
  tailored_resume_url: string | null;
  tailored_match_score: number | null;
  is_tailored: boolean;
  company_research: CompanyResearchDossier | null;
  found_at: string;
}

export interface CompanyResearchDossier {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
}

export interface AgentLog {
  id: string;
  run_id: string | null;
  user_id: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  job_id: string | null;
  created_at: string;
}

/** A tracked application row (`applications`), one per saved job per user. */
export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  closed_reason: ClosedReason | null;
  applied_at: string | null;
  interview_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  /** Sort order inside a Kanban column. */
  position: number;
  /** Interview-prep output; shape is defined by the prep feature (later prompt). */
  prep: unknown | null;
  created_at: string;
  updated_at: string;
}

/** Immutable audit row (`application_events`). */
export interface ApplicationEvent {
  id: string;
  application_id: string;
  user_id: string;
  type: ApplicationEventType;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  created_at: string;
}

/** The subset of `jobs` embedded in an application list item. */
export interface ApplicationJobSummary {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  source: string | null;
  match_score: number | null;
  company_research: CompanyResearchDossier | null;
}

/** An application joined with the job it points at, as returned by the API. */
export type ApplicationListItem = Application & {
  job: ApplicationJobSummary | null;
};

/**
 * The reference a feed card needs to render a status chip and to un-save the
 * row again. Keyed by job id on the /jobs surface (Prompt 3).
 */
export interface ApplicationRef {
  id: string;
  status: ApplicationStatus;
}

/** Body for `POST /api/applications`: track a saved job or a manual role. */
export interface CreateApplicationPayload {
  jobId?: string;
  status?: ApplicationStatus;
  company?: string;
  role?: string;
  url?: string;
}

/** Body for `PATCH /api/applications/[id]`. Only provided fields are applied. */
export interface UpdateApplicationPayload {
  status?: ApplicationStatus;
  closed_reason?: ClosedReason | null;
  position?: number;
  applied_at?: string | null;
  interview_at?: string | null;
  next_follow_up_at?: string | null;
  notes?: string | null;
}

/** Unauthenticated job search result used by the public landing page. */
export interface PublicJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  contractType: string;
  category: string;
  created: string;
  url: string;
  description: string;
}
