import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { upsertUserProfile } from "@/lib/profile";

/**
 * Records that the signed-in user has seen /jobs, so the sidebar's "new
 * matches" badge stops counting jobs found before this moment.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const updated = await upsertUserProfile(user.id, {
      last_jobs_visit_at: new Date().toISOString(),
    });

    if (!updated) {
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