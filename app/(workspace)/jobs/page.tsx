export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { FindJobsClient } from "@/components/find-jobs/FindJobsClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  normalizeJobsTab,
  normalizeResearched,
} from "@/lib/workspace/jobs-tab";
import { NEW_MATCH_SCORE_THRESHOLD } from "@/lib/workspace/constants";
import { privateMetadata } from "../../private-metadata";
import type { Application, ApplicationRef, Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Jobs",
  "For You, All and Saved roles in one feed, scored against your Jobbers profile.",
);

/**
 * Saved can name jobs anywhere in the account (a low-scoring role is still a
 * saved one), so it reads wider than the ranked feed — which stays capped the
 * way Find Jobs always was.
 */
const SAVED_RANGE = 499;
const DEFAULT_RANGE = 99;

type Props = {
  searchParams: Promise<{
    q?: string;
    tab?: string | string[];
    researched?: string | string[];
  }>;
};

/**
 * The merged /jobs surface (Prompt 3).
 *
 * `?tab=` and `?researched=1` are resolved **server-side**, because each tab is
 * a different slice of the whole account — filtering the top 100 by score and
 * calling it "Saved" would silently hide a saved role that ranks low. Filters,
 * sort, view mode and pagination stay client-side in FindJobsClient.
 *
 * The job-fetching backend (Arbeitnow, RemoteOK, Remotive, Jobicy) is
 * untouched; this only narrows what is already in `jobs`.
 */
export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const tab = normalizeJobsTab(params.tab);
  const researched = normalizeResearched(params.researched);

  const user = await requireUser();
  const insforge = await createInsforgeServer();

  // Applications drive the Saved tab and the status chips on every other tab,
  // so they are always fetched — one small, auth-scoped query. A failure reads
  // as "nothing tracked yet" rather than 500ing the whole feed, exactly the way
  // /api/sidebar-summary degrades when the migration has not run.
  const [applicationResult, profileResult] = await Promise.all([
    insforge.database
      .from("applications")
      .select("id, job_id, status")
      .eq("user_id", user.id),
    insforge.database
      .from("profiles")
      .select("job_titles_seeking")
      .eq("id", user.id)
      .maybeSingle<{ job_titles_seeking: string[] | null }>(),
  ]);

  if (applicationResult.error) {
    console.warn(
      "[jobs] applications unavailable:",
      applicationResult.error.message,
    );
  }

  const applications =
    (applicationResult.data as Pick<Application, "id" | "job_id" | "status">[] | null) ?? [];
  const applicationByJobId = new Map<string, ApplicationRef>(
    applications.map((application) => [
      application.job_id,
      { id: application.id, status: application.status },
    ]),
  );

  const hasTargetRoles =
    (profileResult.data?.job_titles_seeking?.length ?? 0) > 0;

  let jobs: Job[] = [];

  // Saved is the one tab that cannot be expressed as "the top N by score".
  if (tab !== "saved" || applicationByJobId.size > 0) {
    let query = insforge.database
      .from("jobs")
      .select("*")
      .eq("user_id", user.id);

    if (tab === "for-you") {
      query = query.gte("match_score", NEW_MATCH_SCORE_THRESHOLD);
    } else if (tab === "saved") {
      query = query.in("id", [...applicationByJobId.keys()]);
    }

    if (researched) {
      query = query.not("company_research", "is", null);
    }

    const { data } = await query
      .order("match_score", { ascending: false, nullsFirst: false })
      .range(0, tab === "saved" ? SAVED_RANGE : DEFAULT_RANGE)
      .returns<Job[]>();

    jobs = (data as Job[] | null) ?? [];

    // Fix for new users: if 0 jobs exist and user set target roles, trigger an instant search
    if (jobs.length === 0 && hasTargetRoles && tab !== "saved") {
      const targetTitle = profileResult.data?.job_titles_seeking?.[0];
      if (targetTitle) {
        try {
          const { searchAll } = await import("@/lib/jobs/search-all");
          const { keywordScoreBatch } = await import("@/lib/jobs/keyword-score");
          const { buildJobRecord } = await import("@/lib/jobs/job-record");

          const searchResult = await searchAll({
            title: targetTitle,
            location: "",
            country: "us",
          });

          if (searchResult.jobs.length > 0) {
            const profileContext = {
              skills: null,
              industries: null,
              experience_level: null,
              job_titles_seeking: profileResult.data?.job_titles_seeking ?? [],
              years_experience: null,
              work_experience: null,
              remote_preference: null,
              preferred_locations: null,
              salary_expectation: null,
              location: null,
            };

            const scores = keywordScoreBatch(searchResult.jobs, profileContext);
            const jobRecords = searchResult.jobs.map((job, idx) =>
              buildJobRecord({
                job,
                userId: user.id,
                runId: null,
                score: scores[idx] ?? {
                  matchScore: 70,
                  matchReason: `Matches target role "${targetTitle}"`,
                  matchedSkills: [],
                  missingSkills: [],
                },
                foundAt: new Date().toISOString(),
              }),
            );

            const { data: inserted } = await insforge.database
              .from("jobs")
              .insert(jobRecords)
              .select();

            if (inserted && inserted.length > 0) {
              jobs = inserted as Job[];
            }
          }
        } catch (err) {
          console.error("[jobs/page] auto-search error:", err);
        }
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <FindJobsClient
        jobs={jobs}
        initialQuery={q}
        tab={tab}
        researched={researched}
        applications={Object.fromEntries(applicationByJobId)}
        hasTargetRoles={hasTargetRoles}
      />
    </div>
  );
}
