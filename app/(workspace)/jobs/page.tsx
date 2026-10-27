export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { FindJobsClient } from "@/components/find-jobs/FindJobsClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { getUserProfile, isProfileComplete } from "@/lib/profile";
import {
  normalizeJobsTab,
  normalizeResearched,
} from "@/lib/workspace/jobs-tab";
import { NEW_MATCH_SCORE_THRESHOLD } from "@/lib/workspace/constants";
import { searchAll } from "@/lib/jobs/search-all";
import { detectCountry } from "@/lib/jobs/country";
import { buildJobRecord } from "@/lib/jobs/job-record";
import { keywordScoreBatch } from "@/lib/jobs/keyword-score";
import { scoringId, type ProfileScoreContext } from "@/lib/jobs/scoring-prompt";
import type { Filter, Sort } from "mongodb";
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
 * The merged /jobs surface.
 *
 * `?tab=` and `?researched=1` are resolved server-side.
 * When tab === "for-you", if the user has not completed their profile,
 * it returns an empty list so the dedicated profile completion CTA is shown.
 * When tab === "all", jobs are ranked by most recent across all boards.
 */
export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const tab = normalizeJobsTab(params.tab);
  const researched = normalizeResearched(params.researched);

  const user = await requireUser();

  const applicationsCollection = await getCollection<Application>("applications");
  const rawApplications = await applicationsCollection.find({ user_id: user.id }).toArray();
  const profile = await getUserProfile(user.id);
  const profileComplete = isProfileComplete(profile);

  const applications = rawApplications as Pick<Application, "id" | "job_id" | "status">[];
  const applicationByJobId = new Map<string, ApplicationRef>(
    applications.map((application) => [
      application.job_id,
      { id: application.id, status: application.status },
    ]),
  );

  const hasTargetRoles = (profile?.job_titles_seeking?.length ?? 0) > 0;
  const jobsCollection = await getCollection<Job>("jobs");
  let jobs: Job[] = [];

  // If on "for-you" and profile is not completed, we do NOT load any jobs
  if (tab === "for-you" && !profileComplete) {
    jobs = [];
  } else if (tab !== "saved" || applicationByJobId.size > 0) {
    const filters: Filter<Job> = { user_id: user.id };
    if (tab === "for-you") {
      filters.match_score = { $gte: NEW_MATCH_SCORE_THRESHOLD } as unknown as number;
    } else if (tab === "saved") {
      filters.id = { $in: [...applicationByJobId.keys()] } as unknown as string;
    }

    if (researched) {
      filters.company_research = { $ne: null } as unknown as null;
    }

    if (q) {
      const queryRegex = { $regex: q, $options: "i" } as unknown as string;
      filters.$or = [
        { title: queryRegex },
        { company: queryRegex },
        { location: queryRegex },
        { about_role: queryRegex },
      ];
    }

    // For You: ranked by best matched (match_score desc) and most recent (found_at desc)
    // All / Saved: ranked by most recent (found_at desc, created_at desc)
    const sortOrder: Sort =
      tab === "for-you"
        ? { match_score: -1, found_at: -1 }
        : { found_at: -1 };

    const limit = tab === "saved" ? SAVED_RANGE : DEFAULT_RANGE;
    const jobsData = await jobsCollection.find(filters).sort(sortOrder).limit(limit).toArray();
    jobs = serializeMongo(
      (jobsData ?? []).map((job) => {
        const { _id, ...rest } = job as unknown as { _id?: unknown } & Job;
        return {
          ...rest,
          id: job.id || (_id ? String(_id) : ""),
        };
      }),
    );

    // Fallback for "for-you" when profile is complete but no job meets >= 60 threshold
    if (tab === "for-you" && profileComplete && jobs.length === 0) {
      const fallbackFilters: Filter<Job> = { user_id: user.id };
      if (researched) {
        fallbackFilters.company_research = { $ne: null } as unknown as null;
      }
      if (q) {
        const queryRegex = { $regex: q, $options: "i" } as unknown as string;
        fallbackFilters.$or = [
          { title: queryRegex },
          { company: queryRegex },
          { location: queryRegex },
          { about_role: queryRegex },
        ];
      }
      const fallbackJobs = await jobsCollection
        .find(fallbackFilters)
        .sort({ match_score: -1, found_at: -1 })
        .limit(DEFAULT_RANGE)
        .toArray();
      if (fallbackJobs && fallbackJobs.length > 0) {
        jobs = serializeMongo(
          fallbackJobs.map((job) => {
            const { _id, ...rest } = job as unknown as { _id?: unknown } & Job;
            return {
              ...rest,
              id: job.id || (_id ? String(_id) : ""),
            };
          }),
        );
      }
    }
  }

  // Automatic live discovery: if the user has no saved/scraped jobs yet
  // (and if on for-you, only if their profile is complete)
  const canAutoDiscover =
    jobs.length === 0 &&
    tab !== "saved" &&
    !researched &&
    (tab !== "for-you" || profileComplete);

  if (canAutoDiscover) {
    try {
      // Detect appropriate country from profile or search query
      const userCountry = detectCountry(
        profile?.location,
        profile?.preferred_locations ?? [],
      );

      // No hardcoded roles:
      // - If query 'q' provided, search exactly that query
      // - If on 'for-you', strictly target user's resume/profile seeking title
      // - If on 'all', search broad opportunities across all industries
      const initialTitle =
        q ||
        (tab === "for-you"
          ? profile?.job_titles_seeking?.[0] || profile?.current_title || ""
          : "");

      const searchLocation =
        tab === "for-you"
          ? profile?.location || ""
          : profile?.location || (userCountry === "ng" ? "Nigeria" : "");

      const searchResult = await searchAll(
        {
          title: initialTitle,
          location: searchLocation,
          country: userCountry,
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
              matchReason: "Matches your search criteria",
              matchedSkills: [],
              missingSkills: [],
            },
            foundAt: now,
          }),
        );

        try {
          await jobsCollection.insertMany(records as unknown as Job[]);
          jobs = records as unknown as Job[];
        } catch (insertError) {
          console.warn("[jobs] auto-seed insert warning:", (insertError as Error).message);
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

        // Rank by best matched and most recent for "for-you",
        // or by most recent for "all"
        if (tab === "for-you") {
          jobs.sort((a, b) => {
            const scoreDiff = (b.match_score ?? 0) - (a.match_score ?? 0);
            if (scoreDiff !== 0) return scoreDiff;
            return new Date(b.found_at ?? "").getTime() - new Date(a.found_at ?? "").getTime();
          });
        } else {
          jobs.sort(
            (a, b) =>
              new Date(b.found_at ?? "").getTime() - new Date(a.found_at ?? "").getTime(),
          );
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
        isProfileComplete={profileComplete}
      />
    </div>
  );
}
