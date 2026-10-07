import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { computeFollowUpDate } from "@/lib/workspace/application-rules";
import {
  APPLICATION_STATUSES,
  CLOSED_REASONS,
  DEFAULT_FOLLOW_UP_DAYS,
} from "@/lib/workspace/constants";
import type { Application } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Single-application API.
 *
 * PATCH  /api/applications/[id]  → update status / dates / notes / position.
 * DELETE /api/applications/[id]  → untrack (delete) the application.
 *
 * Both verify the row belongs to the signed-in user before touching it, so a
 * second user gets a 404 rather than a cross-user read/write.
 */

const updateApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  position: z.number().int().min(0).optional(),
  applied_at: z.string().datetime({ offset: true }).nullable().optional(),
  interview_at: z.string().datetime({ offset: true }).nullable().optional(),
  next_follow_up_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(20000).nullable().optional(),
  closed_reason: z.enum(CLOSED_REASONS).nullable().optional(),
});

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const user = await requireUser();
    const insforge = await createInsforgeServer();

    const json = await req.json().catch(() => null);
    const parsed = updateApplicationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { data: existing, error: findError } = await insforge.database
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<Application>();

    if (findError) {
      console.error("[api/applications/[id]] find", findError);
      return NextResponse.json(
        { success: false, error: "Failed to update application" },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    for (const key of [
      "position",
      "applied_at",
      "interview_at",
      "next_follow_up_at",
      "notes",
      "closed_reason",
    ] as const) {
      if (key in parsed.data) {
        patch[key] = parsed.data[key];
      }
    }

    const previousStatus = existing.status;
    const statusChanged = Boolean(parsed.data.status && parsed.data.status !== previousStatus);
    const nextStatus = parsed.data.status ?? previousStatus;

    if (statusChanged) {
      patch.status = parsed.data.status;

      if (nextStatus === "closed") {
        const reason = parsed.data.closed_reason ?? existing.closed_reason;
        if (!reason) {
          return NextResponse.json(
            { success: false, error: "closed_reason is required to close an application" },
            { status: 400 },
          );
        }
        patch.closed_reason = reason;
      } else if (previousStatus === "closed" && !("closed_reason" in parsed.data)) {
        patch.closed_reason = null;
      }

      if (nextStatus === "applied") {
        const appliedAt =
          parsed.data.applied_at ?? existing.applied_at ?? new Date().toISOString();
        if (!existing.applied_at) patch.applied_at = appliedAt;
        if (!existing.next_follow_up_at && !("next_follow_up_at" in parsed.data)) {
          patch.next_follow_up_at = computeFollowUpDate(appliedAt, DEFAULT_FOLLOW_UP_DAYS);
        }
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true, data: { application: existing } });
    }

    const { data: updated, error: updateError } = await insforge.database
      .from("applications")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single<Application>();

    if (updateError || !updated) {
      console.error("[api/applications/[id]] update", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update application" },
        { status: 500 },
      );
    }

    const events: Record<string, unknown>[] = [];
    if (statusChanged) {
      events.push({
        application_id: id,
        user_id: user.id,
        type: "status_changed",
        from_status: previousStatus,
        to_status: updated.status,
      });
    }
    if ("next_follow_up_at" in patch && patch.next_follow_up_at) {
      events.push({
        application_id: id,
        user_id: user.id,
        type: "follow_up_set",
        to_status: updated.status,
      });
    }
    if (events.length > 0) {
      const { error: eventError } = await insforge.database
        .from("application_events")
        .insert(events);
      if (eventError) {
        console.error("[api/applications/[id]] events", eventError);
      }
    }

    return NextResponse.json({ success: true, data: { application: updated } });
  } catch (error) {
    console.error("[api/applications/[id]] PATCH", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const user = await requireUser();
    const insforge = await createInsforgeServer();

    const { data: existing, error: findError } = await insforge.database
      .from("applications")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();

    if (findError) {
      console.error("[api/applications/[id]] find", findError);
      return NextResponse.json(
        { success: false, error: "Failed to delete application" },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const { error: deleteError } = await insforge.database
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[api/applications/[id]] delete", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete application" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("[api/applications/[id]] DELETE", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete application" },
      { status: 500 },
    );
  }
}