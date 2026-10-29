"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { UserIntegration } from "@/types";

export async function togglePipelineAutoSyncAction(
  enabled: boolean,
): Promise<{ success: boolean; enabled: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const nowIso = new Date().toISOString();
    const coll = await getCollection<UserIntegration>("integrations");

    await coll.updateOne(
      { user_id: user.id, provider: "pipeline_sync" },
      {
        $set: {
          enabled,
          connected: enabled,
          updated_at: nowIso,
        },
        $setOnInsert: {
          id: randomUUID(),
          user_id: user.id,
          provider: "pipeline_sync",
          created_at: nowIso,
        },
      },
      { upsert: true },
    );

    revalidatePath("/integrations");
    return { success: true, enabled };
  } catch (err) {
    console.error("[togglePipelineAutoSyncAction]", err);
    return {
      success: false,
      enabled: !enabled,
      error: (err as Error).message || "Failed to update pipeline sync setting",
    };
  }
}

export async function disconnectIntegrationAction(
  provider: "google_calendar" | "ical_feed",
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const coll = await getCollection<UserIntegration>("integrations");

    await coll.deleteOne({ user_id: user.id, provider });

    revalidatePath("/integrations");
    return { success: true };
  } catch (err) {
    console.error("[disconnectIntegrationAction]", err);
    return {
      success: false,
      error: (err as Error).message || "Failed to disconnect integration",
    };
  }
}

export async function markGoogleCalendarSubscribedAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const nowIso = new Date().toISOString();
    const coll = await getCollection<UserIntegration>("integrations");

    await coll.updateOne(
      { user_id: user.id, provider: "google_calendar" },
      {
        $set: {
          connected: true,
          enabled: true,
          last_synced_at: nowIso,
          account_identifier: user.email || "Google Account",
          "metadata.client_name": "Google Calendar Web",
          updated_at: nowIso,
        },
        $setOnInsert: {
          id: randomUUID(),
          user_id: user.id,
          provider: "google_calendar",
          created_at: nowIso,
          sync_count: 1,
        },
      },
      { upsert: true },
    );

    revalidatePath("/integrations");
    return { success: true };
  } catch (err) {
    console.error("[markGoogleCalendarSubscribedAction]", err);
    return {
      success: false,
      error: (err as Error).message || "Failed to link Google Calendar",
    };
  }
}
