import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Interview } from "@/types";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getCollection<Interview>("interviews");
    const docs = await collection
      .find({ user_id: user.id })
      .sort({ interview_at: 1 })
      .toArray();

    return NextResponse.json({ success: true, interviews: docs });
  } catch (error) {
    console.error("[api/interviews] GET", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.company || !body.role || !body.interview_at) {
      return NextResponse.json(
        { success: false, error: "company, role, and interview_at are required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newInterview: Interview = {
      id: randomUUID(),
      user_id: user.id,
      job_id: body.job_id || null,
      company: String(body.company).trim(),
      role: String(body.role).trim(),
      round_type: body.round_type || "recruiter_screen",
      interview_at: new Date(body.interview_at).toISOString(),
      duration_minutes: Number(body.duration_minutes) || 45,
      meeting_url: body.meeting_url?.trim() || null,
      interviewer_name: body.interviewer_name?.trim() || null,
      interviewer_email: body.interviewer_email?.trim() || null,
      notes: body.notes?.trim() || null,
      status: "scheduled",
      created_at: now,
      updated_at: now,
    };

    const collection = await getCollection<Interview>("interviews");
    await collection.insertOne(newInterview);

    if (newInterview.job_id) {
      try {
        const integrationsColl = await getCollection("integrations");
        const pipelineSetting = await integrationsColl.findOne({
          user_id: user.id,
          provider: "pipeline_sync",
        });
        const isAutoSyncEnabled =
          pipelineSetting && typeof pipelineSetting.enabled === "boolean"
            ? pipelineSetting.enabled
            : true;

        if (isAutoSyncEnabled) {
          const appsCollection = await getCollection<{
            id: string;
            user_id: string;
            job_id: string;
            status: string;
            position: number;
            created_at: string;
            updated_at: string;
          }>("applications");

          await appsCollection.updateOne(
            { user_id: user.id, job_id: newInterview.job_id },
            {
              $set: {
                status: "interview",
                updated_at: now,
              },
              $setOnInsert: {
                id: randomUUID(),
                user_id: user.id,
                job_id: newInterview.job_id,
                position: 0,
                created_at: now,
              },
            },
            { upsert: true },
          );
        }
      } catch (appSyncErr) {
        console.warn("[api/interviews] Failed to auto-sync application stage", appSyncErr);
      }
    }

    return NextResponse.json({ success: true, interview: newInterview });
  } catch (error) {
    console.error("[api/interviews] POST", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

