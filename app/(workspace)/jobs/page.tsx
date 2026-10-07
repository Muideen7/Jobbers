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
