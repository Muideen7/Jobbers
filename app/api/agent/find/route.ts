import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { generateJson } from "@/lib/llm";
import { trackPostHogEvent } from "@/lib/posthog-server";
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
import type { Job } from "@/types";

type RequestBody = {
  jobTitle: string;
  location: string;
};

async function scoreJobsBatch(
  jobs: NormalizedJob[],
  profile: ProfileScoreContext,
): Promise<ScoredResult[]> {
  // C5: the deterministic keyword baseline always runs first — a batch can
  // never come back all-zeros when Gemini is rate-limited (free tier = 20
  // requests/day). C4's fallback still exists; its floor is now a real score
  // instead of "Score unavailable".
  const baseline = keywordScoreBatch(jobs, profile);

  // C1/C2: profile context, per-job description truncation (word-boundary,
  // budgeted) and output-token sizing live in the central builder — this
  // function keeps the Gemini call and the merge with the baseline (C5).
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

  // C5: valid AI results refine the baseline (AI-when-available); anything
  // missing or malformed keeps its keyword score — the AI can improve a
  // score, never blank it.
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

  const insforge = await createInsforgeServer();
  let runId: string | null = null;

  try {
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select(
        "skills, industries, experience_level, job_titles_seeking, " +
          "years_experience, work_experience, remote_preference, " +
          "preferred_locations, salary_expectation, location",
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

    // C5: cross-run dedupe — a listing this search re-found is skipped, so
    // re-running a search no longer grows the list with duplicate rows.
    const { data: existingRows, error: existingError } = await insforge.database
      .from("jobs")
      .select("source, source_url, external_apply_url")
      .eq("user_id", user.id);

    if (existingError) {
      console.error("[api/agent/find] load existing jobs", existingError);
      throw new Error("Failed to load saved jobs");
    }

    const existing = (existingRows as ExistingJobRow[] | null) ?? [];
    const {
      fresh: newJobs,
      duplicates,
      existingCount,
    } = partitionNewJobs(foundJobs, existing);

    // Covers both "the search found nothing" and "everything it found is
    // already saved" — the message reconciles against the list either way.
    if (newJobs.length === 0) {
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

      // C3: highlights/salary/source all flow through the record builder.
      return buildJobRecord({
        job,
        userId: user.id,
        runId,
        score,
        foundAt: new Date().toISOString(),
      });
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

    // C5: the message states inserted, skipped, high matches and the list
    // total — the same total the results table paginates over.
    const successMessage = buildSearchSuccessMessage({
      inserted: savedJobs.length,
      duplicates,
      total: existingCount + savedJobs.length,
      highMatchCount,
    });

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
