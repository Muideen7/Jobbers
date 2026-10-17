import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { computeFollowUpDate } from "@/lib/workspace/application-rules";
import { sendJobbersEmail } from "@/lib/mail";
import {
  APPLICATION_STATUSES,
  CLOSED_REASONS,
  DEFAULT_FOLLOW_UP_DAYS,
} from "@/lib/workspace/constants";
import type { Application, ApplicationEvent } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  position: z.number().int().min(0).optional(),
  applied_at: z.string().datetime({ offset: true }).nullable().optional(),
  interview_at: z.string().datetime({ offset: true }).nullable().optional(),
  next_follow_up_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(20000).nullable().optional(),
  closed_reason: z.enum(CLOSED_REASONS).nullable().optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const applicationsCollection = await getCollection<Application>("applications");
    const eventsCollection = await getCollection<ApplicationEvent>("application_events");

    const json = await req.json().catch(() => null);
    const parsed = updateApplicationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const existing = await applicationsCollection.findOne({
      id,
      user_id: user.id,
    });

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

    const now = new Date().toISOString();
    patch.updated_at = now;

    await applicationsCollection.updateOne(
      { id, user_id: user.id },
      { $set: patch },
    );

    const updated = await applicationsCollection.findOne({ id, user_id: user.id });

    const events: ApplicationEvent[] = [];
    if (statusChanged && updated) {
      events.push({
        id: randomUUID(),
        application_id: id,
        user_id: user.id,
        type: "status_changed",
        from_status: previousStatus,
        to_status: updated.status,
        created_at: now,
      });
    }
    if ("next_follow_up_at" in patch && patch.next_follow_up_at && updated) {
      events.push({
        id: randomUUID(),
        application_id: id,
        user_id: user.id,
        type: "follow_up_set",
        from_status: null,
        to_status: updated.status,
        created_at: now,
      });
    }
    if (events.length > 0) {
      await eventsCollection.insertMany(events);
    }

    if (
      statusChanged &&
      updated &&
      (updated.status === "interview" || updated.status === "offer") &&
      user.email
    ) {
      sendJobbersEmail({
        to: user.email,
        subject: `Application Update: You moved to ${updated.status.toUpperCase()}!`,
        heading: "Great news on your application!",
        bodyText: `Your application status has advanced to "${updated.status}". Check your dashboard for next steps.`,
        ctaLabel: "View Applications",
        ctaUrl: `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/applications`,
      }).catch((err) => console.error("[mail] status email trigger error", err));
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

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const applicationsCollection = await getCollection<Application>("applications");
    const existing = await applicationsCollection.findOne({
      id,
      user_id: user.id,
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await applicationsCollection.deleteOne({ id, user_id: user.id });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("[api/applications/[id]] DELETE", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete application" },
      { status: 500 },
    );
  }
}