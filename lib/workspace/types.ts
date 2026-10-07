import type { ApplicationStage } from "./constants";

/** A single row in the sidebar "Coming up" block. */
export type ComingUpItem = {
  jobId: string;
  company: string;
  role: string;
  type: "interview" | "follow-up";
  /** ISO timestamp of the interview or follow-up. */
  at: string;
  overdue: boolean;
};

/** The full `/api/sidebar-summary` payload, shared by route and hook. */
export type SidebarSummary = {
  newMatches: number;
  dueCount: number;
  activeApplications: number;
  applicationsByStage: Record<ApplicationStage, number>;
  comingUp: ComingUpItem[];
  onboarding: {
    hasResume: boolean;
    hasTargetRoles: boolean;
    hasSavedJob: boolean;
  };
};