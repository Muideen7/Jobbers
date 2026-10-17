import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Resume } from "@/types";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumesColl = await getCollection<Resume & { file_data?: string }>("resumes");
    const resume =
      (await resumesColl.findOne({ user_id: user.id, is_primary: true })) ??
      (await resumesColl.findOne({ user_id: user.id }, { sort: { created_at: -1 } }));

    if (!resume || !resume.file_data) {
      return NextResponse.json({ error: "No resume on file" }, { status: 404 });
    }

    const buffer = Buffer.from(resume.file_data, "base64");
    const filename = resume.name ? `${resume.name.replace(/\.pdf$/i, "")}.pdf` : "resume.pdf";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[api/resume/download]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
