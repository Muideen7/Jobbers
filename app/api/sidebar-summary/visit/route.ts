import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";

/**
 * Records that the signed-in user has seen /jobs, so the sidebar's "new
 * matches" badge stops counting jobs found before this moment.
 *
 * Requires the Prompt 2 migration (`profiles.last_jobs_visit_at`).
 */
export async function POST() {
  try {
    const user = await requireUser();
    const insforge = await createInsforgeServer();

    const { error } = await insforge.database
      .from("profiles")
      .update({ last_jobs_visit_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      console.error("[api/sidebar-summary/visit]", error);
      return NextResponse.json(
        { success: false, error: "Failed to record jobs visit" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/sidebar-summary/visit]", error);
    return NextResponse.json(
      { success: false, error: "Failed to record jobs visit" },
      { status: 500 },
    );
  }
}