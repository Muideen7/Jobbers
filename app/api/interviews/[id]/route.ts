import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Interview } from "@/types";

type InterviewDoc = Interview & { _id?: ObjectId | string };

function buildIdFilter(id: string, userId: string): Filter<InterviewDoc> {
  const filters: Filter<InterviewDoc>[] = [{ id, user_id: userId } as Filter<InterviewDoc>];
  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id), user_id: userId } as Filter<InterviewDoc>);
  }
  return { $or: filters };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const updates: Partial<Interview> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.meeting_url !== undefined) updates.meeting_url = body.meeting_url;
    if (body.interview_at) updates.interview_at = new Date(body.interview_at).toISOString();
    if (body.duration_minutes) updates.duration_minutes = Number(body.duration_minutes);
    if (body.round_type) updates.round_type = body.round_type;

    const collection = await getCollection<InterviewDoc>("interviews");
    const result = await collection.updateOne(buildIdFilter(id, user.id), { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/interviews/[id]] PATCH", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const collection = await getCollection<InterviewDoc>("interviews");
    const result = await collection.deleteOne(buildIdFilter(id, user.id));

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/interviews/[id]] DELETE", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

