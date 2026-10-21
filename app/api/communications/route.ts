import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Communication } from "@/types";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getCollection<Communication>("communications");
    const docs = await collection
      .find({ user_id: user.id })
      .sort({ occurred_at: -1 })
      .toArray();

    return NextResponse.json({ success: true, communications: docs });
  } catch (error) {
    console.error("[api/communications] GET", error);
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
    if (!body || !body.company || !body.role || !body.summary) {
      return NextResponse.json(
        { success: false, error: "company, role, and summary are required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newComm: Communication = {
      id: randomUUID(),
      user_id: user.id,
      job_id: body.job_id || null,
      company: String(body.company).trim(),
      role: String(body.role).trim(),
      contact_name: body.contact_name?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      channel: body.channel || "email",
      direction: body.direction || "inbound",
      subject: body.subject?.trim() || null,
      summary: String(body.summary).trim(),
      occurred_at: body.occurred_at ? new Date(body.occurred_at).toISOString() : now,
      follow_up_deadline: body.follow_up_deadline ? new Date(body.follow_up_deadline).toISOString() : null,
      status: body.status || "needs_reply",
      created_at: now,
      updated_at: now,
    };

    const collection = await getCollection<Communication>("communications");
    await collection.insertOne(newComm);

    return NextResponse.json({ success: true, communication: newComm });
  } catch (error) {
    console.error("[api/communications] POST", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

