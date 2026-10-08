import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { applicationStageRank } from "@/lib/workspace/application-rules";
import { APPLICATION_STATUSES } from "@/lib/workspace/constants";
import type { Application, ApplicationJobSummary, ApplicationListItem } from "@/types";

const JOB_SUMMARY_COLUMNS =
  "id, title, company, location, source, match_score, company_research";

/**
 * `applications` API.
 *
 * GET  /api/applications?stage=<saved|applied|interview|offer|closed>
 *      → this user's applications, each joined with a job summary, sorted by
 *        pipeline stage then manual position.
 * POST /api/applications
 *      → track a job (by id) or a manual role (company + role [+ url]).
 *        Idempotent: re-posting the same job returns the existing row.
 */

const createApplicationSchema = z.object({
  jobId: z.string().uuid().optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  company: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(300).optional(),
  url: z.string().url().max(2048).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const insforge = await createInsforgeServer();

    const stageParam = req.nextUrl.searchParams.get("stage");
    const stage =
      stageParam && (APPLICATION_STATUSES as readonly string[]).includes(stageParam)
        ? stageParam
        : null;

    let query = insforge.database
      .from("applications")
      .select("*")
      .eq("user_id", user.id);

    if (stage) {
      query = query.eq("status", stage);
    }

    const { data: applicationRows, error: applicationsError } = await query;

    if (applicationsError) {
      console.error("[api/applications] list", applicationsError);
      return NextResponse.json(
        { success: false, error: "Failed to load applications" },
        { status: 500 },
      );
    }

    const applications = (applicationRows as Application[] | null) ?? [];

    const jobIds = [...new Set(applications.map((application) => application.job_id))];
    const jobs: ApplicationJobSummary[] = [];
    if (jobIds.length > 0) {
      const { data: jobRows, error: jobError } = await insforge.database
        .from("jobs")
        .select(JOB_SUMMARY_COLUMNS)
        .eq("user_id", user.id)
        .in("id", jobIds);

      if (jobError) {
        console.error("[api/applications] jobs", jobError);
        return NextResponse.json(
          { success: false, error: "Failed to load applications" },
          { status: 500 },
        );
      }

      jobs.push(...((jobRows as ApplicationJobSummary[] | null) ?? []));
    }

    const jobById = new Map(jobs.map((job) => [job.id, job]));
    const items: ApplicationListItem[] = applications
      .map((application) => ({
        ...application,
        job: jobById.get(application.job_id) ?? null,
      }))
      .sort(
        (a, b) =>
          applicationStageRank(a.status) - applicationStageRank(b.status) ||
          a.position - b.position ||
          a.created_at.localeCompare(b.created_at),
      );

    return NextResponse.json({ success: true, data: { applications: items } });
  } catch (error) {
    console.error("[api/applications] GET", error);
    return NextResponse.json(
      { success: false, error: "Failed to load applications" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const insforge = await createInsforgeServer();

    const json = await req.json().catch(() => null);
    const parsed = createApplicationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { jobId, status = "saved", company, role, url } = parsed.data;
    let targetJobId = jobId ?? null;

    if (targetJobId) {
      // Ownership: the job must belong to the signed-in user (RLS on
      // `applications` only guards the application row, not the job it points at).
      const { data: job, error: jobError } = await insforge.database
        .from("jobs")
        .select("id")
        .eq("id", targetJobId)
        .eq("user_id", user.id)
        .maybeSingle<{ id: string }>();

      if (jobError) {
        console.error("[api/applications] job lookup", jobError);
        return NextResponse.json(
          { success: false, error: "Failed to save application" },
          { status: 500 },
        );
      }
      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 },
        );
      }
    } else {
      if (!company || !role) {
        return NextResponse.json(
          { success: false, error: "company and role are required" },
          { status: 400 },
        );
      }

      const { data: manualJob, error: jobError } = await insforge.database
        .from("jobs")
        .insert([
          {
            user_id: user.id,
            source: "manual",
            title: role,
            company,
            source_url: url ?? null,
          },
        ])
        .select("id")
        .single<{ id: string }>();

      if (jobError || !manualJob) {
        console.error("[api/applications] manual job", jobError);
        return NextResponse.json(
          { success: false, error: "Failed to save job" },
          { status: 500 },
        );
      }
      targetJobId = manualJob.id;
    }

    // Already tracked? Return the existing row instead of erroring on the
    // unique (user_id, job_id) constraint.
    const { data: existing, error: existingError } = await insforge.database
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .eq("job_id", targetJobId)
      .maybeSingle<Application>();

    if (existingError) {
      console.error("[api/applications] existing", existingError);
      return NextResponse.json(
        { success: false, error: "Failed to save application" },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json({ success: true, data: { application: existing, created: false } });
    }

    const { data: created, error: createError } = await insforge.database
      .from("applications")
      .insert([{ user_id: user.id, job_id: targetJobId, status, position: 0 }])
      .select()
      .single<Application>();

    if (createError || !created) {
      console.error("[api/applications] create", createError);
      return NextResponse.json(
        { success: false, error: "Failed to save application" },
        { status: 500 },
      );
    }

    await insforge.database.from("application_events").insert([
      {
        application_id: created.id,
        user_id: user.id,
        type: "created",
        to_status: status,
      },
    ]);

    return NextResponse.json(
      { success: true, data: { application: created, created: true } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/applications] POST", error);
    return NextResponse.json(
      { success: false, error: "Failed to save application" },
      { status: 500 },
    );
  }
}