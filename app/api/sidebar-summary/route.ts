import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/profile";
import { endOfToday, isToday } from "@/lib/workspace/application-rules";
import { NEW_MATCH_SCORE_THRESHOLD } from "@/lib/workspace/constants";
import type { ApplicationStage } from "@/lib/workspace/constants";
import type { ComingUpItem, SidebarSummary } from "@/lib/workspace/types";
import type { Filter } from "mongodb";
import type { Application, ApplicationJobSummary, Job } from "@/types";

type ApplicationRow = Pick<
  Application,
  "id" | "job_id" | "status" | "interview_at" | "next_follow_up_at"
>;

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const profile = await getUserProfile(user.id);
    const lastVisit = profile?.last_jobs_visit_at ?? null;

    const jobsCollection = await getCollection<Job>("jobs");
    const applicationsCollection = await getCollection<Application>("applications");

    const newMatchesFilter: Filter<Job> = {
      user_id: user.id,
      match_score: { $gte: NEW_MATCH_SCORE_THRESHOLD } as unknown as number,
    };
    if (lastVisit) {
      newMatchesFilter.found_at = { $gt: lastVisit } as unknown as string;
    }

    const [totalJobsCount, newMatchesCount, applications] = await Promise.all([
      jobsCollection.countDocuments({ user_id: user.id }),
      jobsCollection.countDocuments(newMatchesFilter),
      applicationsCollection.find({ user_id: user.id }).toArray(),
    ]);

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
      const jobRows = await jobsCollection
        .find(
          { user_id: user.id, id: { $in: jobIds } },
          {
            projection: {
              id: 1,
              title: 1,
              company: 1,
              location: 1,
              source: 1,
              match_score: 1,
              company_research: 1,
            },
          },
        )
        .toArray();

      for (const job of jobRows as unknown as ApplicationJobSummary[]) {
        jobsById.set(job.id, job);
      }
    }

    const summary: SidebarSummary = {
      newMatches: newMatchesCount,
      dueCount,
      activeApplications,
      applicationsByStage,
      comingUp: buildComingUp(applications, jobsById),
      onboarding: {
        hasResume: Boolean(profile?.resume_pdf_url),
        hasTargetRoles: (profile?.job_titles_seeking?.length ?? 0) > 0,
        hasSavedJob: totalJobsCount > 0,
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