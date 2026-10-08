import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { endOfToday, isToday } from "@/lib/workspace/application-rules";
import { NEW_MATCH_SCORE_THRESHOLD } from "@/lib/workspace/constants";
import type { ApplicationStage } from "@/lib/workspace/constants";
import type { ComingUpItem, SidebarSummary } from "@/lib/workspace/types";
import type { Application, ApplicationJobSummary } from "@/types";

/**
 * Everything the global sidebar needs, in one auth-scoped request: badge
 * counts, the "Coming up" block and the get-started onboarding flags.
 *
 * The applications queries are wrapped so a project that has not yet run the
 * Prompt 2 migration still serves the onboarding flags and job badges instead
 * of a 500 — the application fields simply read as zero (never fake data).
 */

type ProfileFlagsRow = {
  resume_pdf_url: string | null;
  job_titles_seeking: string[] | null;
  last_jobs_visit_at: string | null;
};

type ApplicationRow = Pick<
  Application,
  "id" | "job_id" | "status" | "interview_at" | "next_follow_up_at"
>;

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

const JOB_SUMMARY_COLUMNS =
  "id, title, company, location, source, match_score, company_research";

async function fetchProfileFlags(
  insforge: InsforgeServer,
  userId: string,
): Promise<ProfileFlagsRow | null> {
  const full = await insforge.database
    .from("profiles")
    .select("resume_pdf_url, job_titles_seeking, last_jobs_visit_at")
    .eq("id", userId)
    .maybeSingle<ProfileFlagsRow>();

  if (!full.error) {
    return full.data ?? null;
  }

  // Pre-migration fallback: `last_jobs_visit_at` does not exist yet.
  const fallback = await insforge.database
    .from("profiles")
    .select("resume_pdf_url, job_titles_seeking")
    .eq("id", userId)
    .maybeSingle<Omit<ProfileFlagsRow, "last_jobs_visit_at">>();

  if (fallback.data) {
    return { ...fallback.data, last_jobs_visit_at: null };
  }
  return null;
}

async function fetchApplications(
  insforge: InsforgeServer,
  userId: string,
): Promise<ApplicationRow[]> {
  const { data, error } = await insforge.database
    .from("applications")
    .select("id, job_id, status, interview_at, next_follow_up_at")
    .eq("user_id", userId);

  if (error) {
    console.warn("[api/sidebar-summary] applications unavailable:", error.message);
    return [];
  }
  return (data as ApplicationRow[] | null) ?? [];
}

function buildComingUp(
  applications: ApplicationRow[],
  jobsById: Map<string, ApplicationJobSummary>,
): ComingUpItem[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const items: ComingUpItem[] = [];
  for (const application of applications) {
    if (application.status === "closed") continue;
    const job = jobsById.get(application.job_id);
    const company = job?.company ?? "";
    const role = job?.title ?? "Untitled role";

    if (application.interview_at) {
      items.push({
        jobId: application.job_id,
        company,
        role,
        type: "interview",
        at: application.interview_at,
        overdue: new Date(application.interview_at).getTime() < startOfToday,
      });
    }
    if (application.next_follow_up_at) {
      items.push({
        jobId: application.job_id,
        company,
        role,
        type: "follow-up",
        at: application.next_follow_up_at,
        overdue: new Date(application.next_follow_up_at).getTime() < startOfToday,
      });
    }
  }

  return items
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return new Date(a.at).getTime() - new Date(b.at).getTime();
    })
    .slice(0, 3);
}

export async function GET() {
  try {
    // Resolve the user directly instead of requireUser(): this is a JSON API,
    // so a signed-out request must return 401 JSON, not a redirect() throw.
    // Wrapping requireUser() inside this try/catch also swallowed its
    // NEXT_REDIRECT as a 500 (the sidebar is fetched on focus/interval, so it
    // can legitimately fire after the session has expired).
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const insforge = await createInsforgeServer();

    // Resolve the profile first so we can scope the "new matches" window.
    const profile = await fetchProfileFlags(insforge, user.id);
    const lastVisit = profile?.last_jobs_visit_at ?? null;

    const newMatchesQuery = insforge.database
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("match_score", NEW_MATCH_SCORE_THRESHOLD);

    const [savedJobResult, newMatchResult] = await Promise.all([
      insforge.database
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      lastVisit ? newMatchesQuery.gt("found_at", lastVisit) : newMatchesQuery,
    ]);

    const applications = await fetchApplications(insforge, user.id);

    const applicationsByStage = {
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
    } satisfies Record<ApplicationStage, number>;

    let activeApplications = 0;
    let dueCount = 0;
    const followUpEnd = endOfToday();

    for (const application of applications) {
      if (application.status in applicationsByStage) {
        applicationsByStage[application.status as ApplicationStage] += 1;
        activeApplications += 1;
      }

      if (application.status === "closed") continue;
      const followUpDue =
        application.next_follow_up_at !== null && application.next_follow_up_at <= followUpEnd;
      const interviewToday =
        application.interview_at !== null && isToday(application.interview_at);
      if (followUpDue || interviewToday) {
        dueCount += 1;
      }
    }

    // Fetch job summaries only for applications that can appear in "Coming up".
    const jobIds = [
      ...new Set(
        applications
          .filter(
            (application) =>
              application.status !== "closed" &&
              (application.interview_at || application.next_follow_up_at),
          )
          .map((application) => application.job_id),
      ),
    ];

    const jobsById = new Map<string, ApplicationJobSummary>();
    if (jobIds.length > 0) {
      const { data: jobs, error: jobsError } = await insforge.database
        .from("jobs")
        .select(JOB_SUMMARY_COLUMNS)
        .eq("user_id", user.id)
        .in("id", jobIds);

      if (jobsError) {
        console.warn("[api/sidebar-summary] comingUp jobs unavailable:", jobsError.message);
      } else {
        for (const job of (jobs as ApplicationJobSummary[] | null) ?? []) {
          jobsById.set(job.id, job);
        }
      }
    }

    const summary: SidebarSummary = {
      newMatches: newMatchResult.count ?? 0,
      dueCount,
      activeApplications,
      applicationsByStage,
      comingUp: buildComingUp(applications, jobsById),
      onboarding: {
        hasResume: Boolean(profile?.resume_pdf_url),
        hasTargetRoles: (profile?.job_titles_seeking?.length ?? 0) > 0,
        hasSavedJob: (savedJobResult.count ?? 0) > 0,
      },
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[api/sidebar-summary]", error);
    return NextResponse.json(
      { success: false, error: "Failed to load sidebar summary" },
      { status: 500 },
    );
  }
}