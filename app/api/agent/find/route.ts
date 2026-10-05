import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { searchJobs, cleanCompanyName } from "@/lib/adzuna";
import { generateJson } from "@/lib/llm";
import { trackPostHogEvent } from "@/lib/posthog-server";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Job } from "@/types";
import type { AdzunaJob } from "@/lib/adzuna";

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
};

async function scoreJobsBatch(
  jobs: AdzunaJob[],
  profile: ProfileScoreContext,
): Promise<ScoredResult[]> {
  const jobList = jobs
    .map(
      (j, i) =>
        `Job ${i + 1} (id: "${j.id}"):
Title: ${j.title}
Company: ${cleanCompanyName(j.company.display_name)}
Description: ${j.description}`,
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

  const unscored: ScoredResult[] = jobs.map((j) => zeroScore(j.id));

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
      .select("skills, industries, experience_level, job_titles_seeking")
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

    const adzunaJobs = await searchJobs(jobTitle.trim(), location.trim(), "us", {
      resultsPerPage: 30,
    });

    if (adzunaJobs.length === 0) {
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

    const scoredResults = await scoreJobsBatch(adzunaJobs, profile);

    const jobRecords = adzunaJobs.map((job, i) => {
      const score = scoredResults[i] ?? {
        matchScore: 0,
        matchReason: "Score unavailable",
        matchedSkills: [],
        missingSkills: [],
      };

      return {
        user_id: user.id,
        run_id: runId,
        source: "search" as const,
        source_url: job.redirect_url,
        external_apply_url: job.redirect_url,
        title: job.title,
        company: cleanCompanyName(job.company.display_name),
        location: job.location.display_name,
        salary:
          job.salary_min != null
            ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round((job.salary_max ?? job.salary_min) / 1000)}k`
            : null,
        job_type: job.contract_type ?? "fulltime",
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
