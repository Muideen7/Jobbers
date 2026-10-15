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
import { searchAll } from "@/lib/jobs/search-all";
import { buildJobRecord } from "@/lib/jobs/job-record";
import { keywordScoreBatch } from "@/lib/jobs/keyword-score";
import { scoringId, type ProfileScoreContext } from "@/lib/jobs/scoring-prompt";
import { privateMetadata } from "../../private-metadata";
import type { Application, ApplicationRef, Job, Profile } from "@/types";

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
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
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

  const profile = profileResult.data;
  const hasTargetRoles =
    (profile?.job_titles_seeking?.length ?? 0) > 0;

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

    // Resilient fallback for "for-you": if no job meets the >= 60 threshold
    // (e.g. freshly scraped or unscored listings), fall back to available jobs
    // ordered by match_score desc so the feed and sidebar filters aren't trapped in an empty state.
    if (tab === "for-you" && jobs.length === 0) {
      let fallbackQuery = insforge.database
        .from("jobs")
        .select("*")
        .eq("user_id", user.id);

      if (researched) {
        fallbackQuery = fallbackQuery.not("company_research", "is", null);
      }

      const { data: fallbackData } = await fallbackQuery
        .order("match_score", { ascending: false, nullsFirst: false })
        .order("found_at", { ascending: false })
        .range(0, DEFAULT_RANGE)
        .returns<Job[]>();

      if (fallbackData && fallbackData.length > 0) {
        jobs = fallbackData;
      }
    }
  }

  // Automatic live discovery: if the user has no saved/scraped jobs yet,
  // automatically fan out to the multi-board providers (Arbeitnow, RemoteOK,
  // Remotive, Jobicy, JSearch, Adzuna) so the Find Jobs page shows real roles
  // immediately without requiring manual searching or filtering first.
  if (jobs.length === 0 && tab !== "saved" && !researched) {
    try {
      const initialTitle =
        q ||
        profile?.job_titles_seeking?.[0] ||
        profile?.current_title ||
        "developer";

      const searchResult = await searchAll(
        {
          title: initialTitle,
          location: profile?.location || "",
          country: "us",
        },
        { maxResults: 40 },
      );

      if (searchResult.jobs.length > 0) {
        const profileContext: ProfileScoreContext = {
          skills: profile?.skills ?? [],
          industries: profile?.industries ?? [],
          experience_level: profile?.experience_level ?? "mid",
          job_titles_seeking: profile?.job_titles_seeking ?? [],
          years_experience: profile?.years_experience ?? 0,
          work_experience: profile?.work_experience ?? [],
          remote_preference: profile?.remote_preference ?? "any",
          preferred_locations:
            profile?.preferred_locations ??
            (profile?.location ? [profile.location] : []),
          salary_expectation: profile?.salary_expectation ?? null,
          location: profile?.location ?? null,
        };

        const scores = keywordScoreBatch(searchResult.jobs, profileContext);
        const scoreMap = new Map(scores.map((s) => [s.jobId, s]));
        const now = new Date().toISOString();

        const records = searchResult.jobs.map((job) =>
          buildJobRecord({
            job,
            userId: user.id,
            runId: null,
            score: scoreMap.get(scoringId(job)) ?? {
              matchScore: 70,
              matchReason: "Matches your target roles",
              matchedSkills: [],
              missingSkills: [],
            },
            foundAt: now,
          }),
        );

        // Attempt database insert so detail pages, applications, and dossiers resolve seamlessly
        const { data: inserted, error: insertError } = await insforge.database
          .from("jobs")
          .insert(records)
          .select();

        if (inserted && inserted.length > 0) {
          jobs = inserted as Job[];
        } else {
          if (insertError) {
            console.warn("[jobs] auto-seed insert warning:", insertError.message);
          }
          // In-memory fallback with IDs so the user is NEVER blocked from seeing jobs
          jobs = records.map((record, idx) => ({
            ...record,
            id: `live_${record.source}_${idx}`,
            created_at: now,
            updated_at: now,
            company_research: null,
            cover_letter: null,
            tailored_resume_url: null,
            tailored_match_score: null,
            is_tailored: false,
            nice_to_have: [],
            about_company: null,
          })) as unknown as Job[];
        }

        // Rank by match score if on For You tab
        if (tab === "for-you") {
          jobs.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
        }
      }
    } catch (err) {
      console.error("[jobs] auto-discovery error:", err);
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
