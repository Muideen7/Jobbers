import { NextRequest, NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const insforge = await createInsforgeServer();

    const { data: resume, error } = await insforge.database
      .from("resumes")
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<{ storage_path: string | null }>();

    if (error) {
      console.error("[api/resume/download/[id]]", error);
      return NextResponse.json({ error: "Failed to load resume" }, { status: 500 });
    }
    if (!resume?.storage_path) {
      return NextResponse.json({ error: "No resume on file" }, { status: 404 });
    }

    const { data: blob, error: dlError } = await insforge.storage
      .from("resumes")
      .download(resume.storage_path);

    if (dlError || !blob) {
      console.error("[api/resume/download/[id]]", dlError);
      return NextResponse.json({ error: "Failed to download resume" }, { status: 500 });
    }

    const buffer = await blob.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error("[api/resume/download/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}