import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Communication } from "@/types";

type CommDoc = Communication & { _id?: ObjectId | string };

function buildIdFilter(id: string, userId: string): Filter<CommDoc> {
  const filters: Filter<CommDoc>[] = [{ id, user_id: userId } as Filter<CommDoc>];
  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id), user_id: userId } as Filter<CommDoc>);
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

    const updates: Partial<Communication> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) updates.status = body.status;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.follow_up_deadline !== undefined) {
      updates.follow_up_deadline = body.follow_up_deadline ? new Date(body.follow_up_deadline).toISOString() : null;
    }
    if (body.contact_name !== undefined) updates.contact_name = body.contact_name;
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email;

    const collection = await getCollection<CommDoc>("communications");
    const result = await collection.updateOne(buildIdFilter(id, user.id), { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Communication not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/communications/[id]] PATCH", error);
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

    const collection = await getCollection<CommDoc>("communications");
    const result = await collection.deleteOne(buildIdFilter(id, user.id));

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Communication not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/communications/[id]] DELETE", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

