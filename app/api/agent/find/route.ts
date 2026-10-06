import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { generateJson } from "@/lib/llm";
import { trackPostHogEvent } from "@/lib/posthog-server";
import { detectCountry } from "@/lib/jobs/country";
import { searchAll } from "@/lib/jobs/search-all";
import { sourceWarningLogRows } from "@/lib/jobs/source-warnings";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { NormalizedJob } from "@/lib/jobs/types";
import type { Job } from "@/types";

type RequestBody = {
  jobTitle: string;
  location: string;
};

type ScoredResult = {
  jobId: string;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

type ProfileScoreContext = {
  skills: string[] | null;
  industries: string[] | null;
  experience_level: string | null;
  job_titles_seeking: string[] | null;
  // B1: inputs for search-country detection (C1 folds them into scoring too).
  location: string | null;
  preferred_locations: string[] | null;
};

// JSearch and the feeds return full multi-KB descriptions; scoring on the
// first ~1200 chars keeps the Gemini prompt bounded (plan C2 refines this).
const SCORING_DESCRIPTION_CHARS = 1200;

function scoringId(job: NormalizedJob): string {
  // externalIds are unique per source only — "123" from Adzuna and "123"
  // from RemoteOK are different jobs, so the source namespaces the id.
  return `${job.source}:${job.externalId}`;
}

async function scoreJobsBatch(
  jobs: NormalizedJob[],
  profile: ProfileScoreContext,
): Promise<ScoredResult[]> {
  const jobList = jobs
    .map(
      (j, i) =>
        `Job ${i + 1} (id: "${scoringId(j)}"):
Title: ${j.title}
Company: ${j.company || "Unknown company"}
Description: ${j.description.slice(0, SCORING_DESCRIPTION_CHARS)}`,
    )
    .join("\n\n");

  const profileContext = JSON.stringify({
    skills: profile.skills,
    industries: profile.industries,
    experience_level: profile.experience_level,
    desired_roles: profile.job_titles_seeking,
  });

  const zeroScore = (jobId: string): ScoredResult => ({
    jobId,
    matchScore: 0,
    matchReason: "Score unavailable",
    matchedSkills: [],
    missingSkills: [],
  });

  const unscored: ScoredResult[] = jobs.map((j) => zeroScore(scoringId(j)));

  let parsed: { results?: ScoredResult[] };

  try {
    parsed = (await generateJson({
      system:
        "You are a job matching assistant. Score each job against the candidate profile and return only valid JSON.",
      prompt: `Score each of the following ${jobs.length} jobs against this candidate profile and return JSON with this exact shape:
{
  "results": [
    {
      "jobId": "string — the id field from the job",
      "matchScore": number (0-100),
      "matchReason": "string — one concise paragraph explaining the match",
      "matchedSkills": ["string"],
      "missingSkills": ["string"]
    }
  ]
}

Candidate profile:
${profileContext}

Jobs to score:
${jobList}`,
      temperature: 0.3,
      maxOutputTokens: 1200,
    })) as { results?: ScoredResult[] };
  } catch (error) {
    console.error("[api/agent/find] scoreJobsBatch", error);
    return unscored;
  }

  // Prefer the jobId match, fall back to positional order (Gemini is told to
  // return them in order), then to this job's zero score. Iterating `unscored`
  // rather than indexing it in parallel with `jobs` removes the last
  // unchecked-index read: `fallback` is the element, so it cannot be undefined.
  return unscored.map((fallback, i) => {
    const scored =
      parsed.results?.find((r) => r.jobId === fallback.jobId) ??
      parsed.results?.at(i);

    return scored ?? fallback;
  });
}

/**
 * Cross-source salary rules: the source's own text wins (currency and period
 * intact, e.g. Remotive's "$45-$120/Hour"). Numeric figures only collapse to
 * the "$120k" convention when the period is yearly or unstated — hourly and
 * monthly numbers are dropped rather than mislabelled. Currency tracking for
 * numeric figures is plan C2's known gap.
 */
function formatSalaryForDb(job: NormalizedJob): string | null {
  if (job.salaryText) {
    return job.salaryText;
  }

  const { salaryMin: min, salaryMax: max } = job;
  if (min == null || (job.salaryPeriod !== null && job.salaryPeriod !== "YEAR")) {
    return null;
  }

  const short = (value: number) => `$${Math.round(value / 1000)}k`;

  if (max != null && min === max) {
    return short(min);
  }
  if (max != null) {
    return `${short(min)} - ${short(max)}`;
  }
  return `${short(min)}+`;
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

  const insforge = await createInsforgeServer();
  let runId: string | null = null;

  try {
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select(
        "skills, industries, experience_level, job_titles_seeking, location, preferred_locations",
      )
      .eq("id", user.id)
      .maybeSingle<ProfileScoreContext>();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    const { data: run, error: runError } = await insforge.database
      .from("agent_runs")
      .insert([
        {
          user_id: user.id,
          status: "running",
          job_title_searched: jobTitle.trim(),
          location_searched: location.trim() || null,
          jobs_found: 0,
          started_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single<{ id: string }>();

    if (runError || !run) {
      console.error("[api/agent/find] create agent_run", runError);
      return NextResponse.json(
        { success: false, error: "Failed to start agent run" },
        { status: 500 },
      );
    }

    runId = run.id;

    await trackPostHogEvent({
      event: "job_search_started",
      properties: {
        userId: user.id,
        jobTitle: jobTitle.trim(),
        location: location.trim(),
      },
    });

    // B1: derive the search country from what the user typed, falling back to
    // the profile's preferred then current location. Adzuna skips unsupported
    // codes inside its provider (ng → silent no-op), JSearch accepts any ISO
    // code, and the remote feeds ignore country entirely.
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

    // B2: a failing source (e.g. Adzuna 404, JSearch quota) never fails the
    // run — record it in agent_logs and continue with whatever succeeded.
    const warningRows = sourceWarningLogRows({
      runId,
      userId: user.id,
      outcomes: searchResult.outcomes,
    });
    if (warningRows.length > 0) {
      const { error: warningError } = await insforge.database
        .from("agent_logs")
        .insert(warningRows);
      if (warningError) {
        console.error("[api/agent/find] source warnings", warningError);
      }
    }

    if (foundJobs.length === 0) {
      await insforge.database
        .from("agent_runs")
        .update({
          status: "completed",
          jobs_found: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId)
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          successMessage:
            "No jobs found for that search. Try a different title or location.",
        },
      });
    }

    const scoredResults = await scoreJobsBatch(foundJobs, profile);

    const jobRecords = foundJobs.map((job, i) => {
      const score = scoredResults[i] ?? {
        matchScore: 0,
        matchReason: "Score unavailable",
        matchedSkills: [],
        missingSkills: [],
      };

      return {
        user_id: user.id,
        run_id: runId,
        // Provider id ("jsearch", "adzuna", …) so every saved row can be
        // attributed to its source (plan A7); legacy rows say "search".
        source: job.source,
        source_url: job.sourceUrl || job.applyUrl,
        external_apply_url: job.applyUrl,
        title: job.title,
        company: job.company || "Unknown company",
        location: job.location || (job.remote ? "Remote" : "Unknown location"),
        salary: formatSalaryForDb(job),
        job_type: job.employmentType ?? "fulltime",
        about_role: job.description,
        match_score: score.matchScore,
        match_reason: score.matchReason,
        matched_skills: score.matchedSkills,
        missing_skills: score.missingSkills,
        found_at: new Date().toISOString(),
      };
    });

    const { data: insertedJobs, error: insertError } = await insforge.database
      .from("jobs")
      .insert(jobRecords)
      .select();

    if (insertError) {
      console.error("[api/agent/find] insert jobs", insertError);
      throw new Error("Failed to save jobs");
    }

    const savedJobs = (insertedJobs as Job[]) ?? [];

    for (const job of savedJobs) {
      await trackPostHogEvent({
        event: "job_found",
        properties: {
          userId: user.id,
          source: "search",
          matchScore: job.match_score ?? 0,
        },
      });
    }

    await insforge.database
      .from("agent_runs")
      .update({
        status: "completed",
        jobs_found: savedJobs.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", user.id);

    const highMatchCount = savedJobs.filter(
      (j) => (j.match_score ?? 0) >= MATCH_THRESHOLD,
    ).length;

    const successMessage =
      highMatchCount > 0
        ? `Found ${savedJobs.length} jobs and saved ${highMatchCount} strong match${highMatchCount === 1 ? "" : "es"}.`
        : `Found ${savedJobs.length} job${savedJobs.length === 1 ? "" : "s"}. No high matches yet — try a broader search.`;

    return NextResponse.json({
      success: true,
      data: { jobs: savedJobs, successMessage },
    });
  } catch (error) {
    console.error("[api/agent/find]", error);

    if (runId) {
      await insforge.database
        .from("agent_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId)
        .eq("user_id", user.id);
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
