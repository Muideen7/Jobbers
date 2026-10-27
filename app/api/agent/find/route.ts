import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/profile";
import { generateJson } from "@/lib/llm";
import { detectCountry } from "@/lib/jobs/country";
import { buildJobRecord } from "@/lib/jobs/job-record";
import { keywordScoreBatch, reconcileWithAiResults } from "@/lib/jobs/keyword-score";
import {
  buildSearchSuccessMessage,
  partitionNewJobs,
  type ExistingJobRow,
} from "@/lib/jobs/search-summary";
import {
  buildScoringPrompt,
  type ProfileScoreContext,
  type ScoredResult,
} from "@/lib/jobs/scoring-prompt";
import { searchAll } from "@/lib/jobs/search-all";
import { sourceWarningLogRows } from "@/lib/jobs/source-warnings";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { NormalizedJob } from "@/lib/jobs/types";
import type { AgentLog, AgentRun, Job } from "@/types";

type RequestBody = {
  jobTitle: string;
  location: string;
};

async function scoreJobsBatch(
  jobs: NormalizedJob[],
  profile: ProfileScoreContext,
): Promise<ScoredResult[]> {
  const baseline = keywordScoreBatch(jobs, profile);

  const { system, prompt, maxOutputTokens } = buildScoringPrompt({
    jobs,
    profile,
  });

  let parsed: { results?: unknown };

  try {
    parsed = (await generateJson({
      system,
      prompt,
      temperature: 0.3,
      maxOutputTokens,
    })) as { results?: unknown };
  } catch (error) {
    console.error("[api/agent/find] scoreJobsBatch", error);
    return baseline;
  }

  return reconcileWithAiResults(baseline, parsed);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { jobTitle, location } = body;
  if (!jobTitle?.trim()) {
    return NextResponse.json(
      { success: false, error: "jobTitle is required" },
      { status: 400 },
    );
  }

  let runId: string | null = null;
  const runsCollection = await getCollection<AgentRun>("agent_runs");

  try {
    const rawProfile = await getUserProfile(user.id);

    const profile: ProfileScoreContext = {
      skills: rawProfile?.skills ?? [],
      industries: rawProfile?.industries ?? [],
      experience_level: rawProfile?.experience_level ?? "mid",
      job_titles_seeking: rawProfile?.job_titles_seeking ?? (jobTitle.trim() ? [jobTitle.trim()] : []),
      years_experience: rawProfile?.years_experience ?? 0,
      work_experience: rawProfile?.work_experience ?? [],
      remote_preference: rawProfile?.remote_preference ?? "any",
      preferred_locations:
        rawProfile?.preferred_locations ??
        (location.trim() ? [location.trim()] : rawProfile?.location ? [rawProfile.location] : []),
      salary_expectation: rawProfile?.salary_expectation ?? null,
      location: location.trim() || rawProfile?.location || null,
    };

    runId = randomUUID();
    await runsCollection.insertOne({
      id: runId,
      user_id: user.id,
      status: "running",
      job_title_searched: jobTitle.trim(),
      location_searched: location.trim() || null,
      jobs_found: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
    });

    const country = detectCountry(location.trim(), [
      ...(profile.preferred_locations ?? []),
      profile.location,
    ]);

    const searchResult = await searchAll({
      title: jobTitle.trim(),
      location: location.trim(),
      country,
    });
    const foundJobs = searchResult.jobs;

    const warningRows = sourceWarningLogRows({
      runId,
      userId: user.id,
      outcomes: searchResult.outcomes,
    });
    if (warningRows.length > 0) {
      const logsCollection = await getCollection<AgentLog>("agent_logs");
      await logsCollection.insertMany(warningRows as unknown as AgentLog[]);
    }

    const jobsCollection = await getCollection<Job>("jobs");
    const existingRows = await jobsCollection
      .find({ user_id: user.id })
      .project({ source: 1, source_url: 1, external_apply_url: 1 })
      .toArray();

    const existing = (existingRows as unknown as ExistingJobRow[] | null) ?? [];
    const {
      fresh: newJobs,
      duplicates,
      existingCount,
    } = partitionNewJobs(foundJobs, existing);

    if (newJobs.length === 0) {
      await runsCollection.updateOne(
        { id: runId, user_id: user.id },
        {
          $set: {
            status: "completed",
            jobs_found: 0,
            completed_at: new Date().toISOString(),
          },
        },
      );

      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          successMessage: buildSearchSuccessMessage({
            inserted: 0,
            duplicates,
            total: existingCount,
            highMatchCount: 0,
          }),
        },
      });
    }

    const scoredResults = await scoreJobsBatch(newJobs, profile);

    const jobRecords = newJobs.map((job, i) => {
      const score = scoredResults[i] ?? {
        matchScore: 0,
        matchReason: "Score unavailable",
        matchedSkills: [],
        missingSkills: [],
      };

      return buildJobRecord({
        job,
        userId: user.id,
        runId,
        score,
        foundAt: new Date().toISOString(),
      });
    });

    if (jobRecords.length > 0) {
      const operations = jobRecords.map((record) => ({
        updateOne: {
          filter: { id: record.id, user_id: user.id },
          update: { $set: record },
          upsert: true,
        },
      }));
      await jobsCollection.bulkWrite(operations, { ordered: false });
    }

    await runsCollection.updateOne(
      { id: runId, user_id: user.id },
      {
        $set: {
          status: "completed",
          jobs_found: jobRecords.length,
          completed_at: new Date().toISOString(),
        },
      },
    );

    const highMatchCount = jobRecords.filter(
      (j) => (j.match_score ?? 0) >= MATCH_THRESHOLD,
    ).length;

    const successMessage = buildSearchSuccessMessage({
      inserted: jobRecords.length,
      duplicates,
      total: existingCount + jobRecords.length,
      highMatchCount,
    });

    return NextResponse.json({
      success: true,
      data: { jobs: jobRecords as unknown as Job[], successMessage },
    });
  } catch (error) {
    console.error("[api/agent/find]", error);

    if (runId) {
      try {
        await runsCollection.updateOne(
          { id: runId, user_id: user.id },
          {
            $set: {
              status: "failed",
              completed_at: new Date().toISOString(),
            },
          },
        );
      } catch (runErr) {
        console.error("[api/agent/find] failed to record failure status", runErr);
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
