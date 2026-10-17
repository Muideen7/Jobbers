import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Resume } from "@/types";

import type { Filter } from "mongodb";

type ResumeDoc = Resume & {
  _id?: ObjectId | string;
  file_data?: string;
};

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const idFilters: Filter<ResumeDoc>[] = [{ id } as Filter<ResumeDoc>];
    if (ObjectId.isValid(id)) {
      idFilters.push({ _id: new ObjectId(id) } as Filter<ResumeDoc>);
    } else {
      idFilters.push({ _id: id } as Filter<ResumeDoc>);
    }

    const resumesColl = await getCollection<ResumeDoc>("resumes");
    const resume = await resumesColl.findOne({
      $or: idFilters,
      user_id: user.id,
    });

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
    console.error("[api/resume/download/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}