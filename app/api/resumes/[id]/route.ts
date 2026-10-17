import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { upsertUserProfile } from "@/lib/profile";
import { setPrimaryResume, updateResume, deleteResume } from "@/lib/resumes";
import type { Resume } from "@/types";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const json = await req.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }
    const body = json as { action?: string; name?: string; is_primary?: boolean };

    if (body.action === "set_primary" || body.is_primary) {
      const ok = await setPrimaryResume(id, user.id);
      return NextResponse.json({ success: ok });
    }
    if (body.action === "rename" && typeof body.name === "string" && body.name.trim()) {
      const resume = await updateResume(id, user.id, { name: body.name.trim() });
      return NextResponse.json({ success: !!resume });
    }
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (body.is_primary) {
      updates.is_primary = true;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields" }, { status: 400 });
    }
    const resume = await updateResume(id, user.id, updates as Partial<Resume>);
    if ((updates.is_primary as boolean) && resume) {
      await setPrimaryResume(id, user.id);
    }
    return NextResponse.json({ success: !!resume });
  } catch (e) {
    console.error("[api/resumes/[id]] PATCH", e);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const resumesColl = await getCollection<Resume & { _id?: unknown }>("resumes");
    const resume = await resumesColl.findOne({
      $or: [{ id }, { _id: id as unknown as ObjectId }],
      user_id: user.id,
    });

    const ok = await deleteResume(id, user.id);
    if (!ok) return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });

    if (resume?.is_primary) {
      const latest = await resumesColl
        .find({ user_id: user.id })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();

      const nextCandidate = latest?.[0];
      if (nextCandidate) {
        const nextPrimaryId = nextCandidate.id || (nextCandidate._id ? String(nextCandidate._id) : undefined);
        if (nextPrimaryId) {
          await setPrimaryResume(nextPrimaryId, user.id);
        }
      } else {
        await upsertUserProfile(user.id, { resume_pdf_url: null });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/resumes/[id]] DELETE", e);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}