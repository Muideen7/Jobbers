import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { Filter } from "mongodb";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { applicationStageRank } from "@/lib/workspace/application-rules";
import { APPLICATION_STATUSES } from "@/lib/workspace/constants";
import type { Application, ApplicationEvent, ApplicationJobSummary, ApplicationListItem, Job } from "@/types";

const createApplicationSchema = z.object({
  jobId: z.string().optional(),
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

    const applicationsCollection = await getCollection<Application>("applications");
    const jobsCollection = await getCollection<Job>("jobs");

    const stageParam = req.nextUrl.searchParams.get("stage");
    const stage =
      stageParam && (APPLICATION_STATUSES as readonly string[]).includes(stageParam)
        ? stageParam
        : null;

    const filter: Filter<Application> = { user_id: user.id };
    if (stage) {
      filter.status = stage as Application["status"];
    }

    const applications = await applicationsCollection.find(filter).toArray();

    const jobIds = [...new Set(applications.map((app) => app.job_id))];
    const jobs: ApplicationJobSummary[] = [];

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

      jobs.push(...(jobRows as unknown as ApplicationJobSummary[]));
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
          (a.created_at || "").localeCompare(b.created_at || ""),
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

    const applicationsCollection = await getCollection<Application>("applications");
    const jobsCollection = await getCollection<Job>("jobs");
    const eventsCollection = await getCollection<ApplicationEvent>("application_events");

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
      let job = await jobsCollection.findOne({
        id: targetJobId,
        user_id: user.id,
      });

      if (!job) {
        job = await jobsCollection.findOne({ id: targetJobId });
        if (job) {
          const { _id, ...cloned } = job as unknown as { _id?: unknown } & Record<string, unknown>;
          void _id;
          await jobsCollection.insertOne({
            ...(cloned as unknown as Job),
            user_id: user.id,
          });
        }
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

      const manualJobId = randomUUID();
      const now = new Date().toISOString();
      const manualJob = {
        id: manualJobId,
        user_id: user.id,
        source: "url" as const,
        source_url: url ?? null,
        external_apply_url: null,
        title: role,
        company,
        location: null,
        salary: null,
        job_type: null,
        about_role: null,
        responsibilities: [],
        requirements: [],
        nice_to_have: [],
        benefits: [],
        about_company: null,
        match_score: null,
        match_reason: null,
        matched_skills: [],
        missing_skills: [],
        cover_letter: null,
        tailored_resume_url: null,
        tailored_match_score: null,
        is_tailored: false,
        company_research: null,
        found_at: now,
      };

      await jobsCollection.insertOne(manualJob as unknown as Job);
      targetJobId = manualJobId;
    }

    const existing = await applicationsCollection.findOne({
      user_id: user.id,
      job_id: targetJobId,
    });

    if (existing) {
      if (status && status !== existing.status) {
        const now = new Date().toISOString();
        await applicationsCollection.updateOne(
          { id: existing.id, user_id: user.id },
          {
            $set: {
              status,
              updated_at: now,
              ...(status === "applied" ? { applied_at: now } : {}),
            },
          },
        );
        await eventsCollection.insertOne({
          id: randomUUID(),
          application_id: existing.id,
          user_id: user.id,
          type: "status_changed",
          from_status: existing.status,
          to_status: status,
          created_at: now,
        });
        existing.status = status;
      }
      return NextResponse.json({
        success: true,
        data: { application: existing, created: false },
      });
    }

    const now = new Date().toISOString();
    const created: Application = {
      id: randomUUID(),
      user_id: user.id,
      job_id: targetJobId,
      status,
      position: 0,
      applied_at: status === "applied" ? now : null,
      interview_at: null,
      next_follow_up_at: null,
      notes: null,
      closed_reason: null,
      prep: null,
      created_at: now,
      updated_at: now,
    };

    await applicationsCollection.insertOne(created);

    await eventsCollection.insertOne({
      id: randomUUID(),
      application_id: created.id,
      user_id: user.id,
      type: "created",
      from_status: null,
      to_status: status,
      created_at: now,
    });

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