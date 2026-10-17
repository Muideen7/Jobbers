import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { researchCompany } from "@/agent/research";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/profile";
import type { AgentLog, Job, Profile } from "@/types";

type RequestBody = {
  jobId?: unknown;
};

type ResearchJobRow = Pick<
  Job,
  | "id"
  | "user_id"
  | "title"
  | "company"
  | "source_url"
  | "external_apply_url"
  | "about_role"
  | "matched_skills"
  | "missing_skills"
  | "company_research"
>;

type ResearchProfileRow = Pick<
  Profile,
  | "id"
  | "current_title"
  | "experience_level"
  | "years_experience"
  | "skills"
  | "work_experience"
>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = user.id;

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 },
      );
    }

    const jobsCollection = await getCollection<Job>("jobs");
    const logsCollection = await getCollection<AgentLog>("agent_logs");

    async function logAgentMessage(input: {
      message: string;
      level: AgentLog["level"];
    }): Promise<void> {
      try {
        await logsCollection.insertOne({
          id: randomUUID(),
          run_id: null,
          user_id: userId,
          job_id: jobId,
          message: input.message,
          level: input.level,
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.error("[api/agent/research] logAgentMessage", logErr);
      }
    }

    const job = await jobsCollection.findOne({
      id: jobId,
      user_id: userId,
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    if (job.company_research) {
      return NextResponse.json({
        success: true,
        data: { dossier: job.company_research },
      });
    }

    const rawProfile = await getUserProfile(userId);
    if (!rawProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    const profile: ResearchProfileRow = {
      id: rawProfile.id,
      current_title: rawProfile.current_title,
      experience_level: rawProfile.experience_level,
      years_experience: rawProfile.years_experience,
      skills: rawProfile.skills,
      work_experience: rawProfile.work_experience,
    };

    await logAgentMessage({
      message: `Starting company research for ${job.company ?? "this company"}.`,
      level: "info",
    });

    const result = await researchCompany({
      job: job as ResearchJobRow,
      profile,
      log: logAgentMessage,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Company research failed" },
        { status: 500 },
      );
    }

    await jobsCollection.updateOne(
      { id: jobId, user_id: userId },
      { $set: { company_research: result.dossier } },
    );

    revalidatePath(`/jobs/${jobId}`);

    return NextResponse.json({
      success: true,
      data: { dossier: result.dossier },
    });
  } catch (error) {
    console.error("[api/agent/research]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
