import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { setPrimaryResume, updateResume, deleteResume } from "@/lib/resumes";

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
    // Generic update fallback
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (body.is_primary) {
      updates.is_primary = true;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields" }, { status: 400 });
    }
    const resume = await updateResume(id, user.id, updates as Partial<import("@/types").Resume>);
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
    const insforge = await createInsforgeServer();
    const { data: resume } = await insforge.database
      .from("resumes")
      .select("storage_path, is_primary")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<{ storage_path: string | null; is_primary: boolean }>();
    const ok = await deleteResume(id, user.id);
    if (!ok) return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    // Optionally delete from storage if path matches
    if (resume?.storage_path) {
      try {
        await insforge.storage.from("resumes").remove(resume.storage_path);
      } catch (e) {
        console.warn("[api/resumes/[id]] storage cleanup failed", e);
      }
    }
    // If primary deleted, promote most recent remaining
    if (resume?.is_primary) {
      const { data: latest } = await insforge.database
        .from("resumes")
        .select("id, storage_path")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (latest && latest.length > 0) {
        const r = latest[0] as { id: string };
        await setPrimaryResume(r.id, user.id);
      } else {
        await insforge.database.from("profiles").update({ resume_pdf_url: null }).eq("id", user.id);
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/resumes/[id]] DELETE", e);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}