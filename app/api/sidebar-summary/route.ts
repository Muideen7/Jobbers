import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { NEW_MATCH_SCORE_THRESHOLD } from "@/lib/workspace/constants";
import type { SidebarSummary } from "@/lib/workspace/types";

/**
 * Everything the global sidebar needs, in one auth-scoped request: badge
 * counts, the "Coming up" block and the get-started onboarding flags.
 *
 * Prompt 1 ships before the applications layer exists, so the application
 * fields are honest zeros and `comingUp` is empty — never fake data. Prompt 2
 * replaces those with real queries against `applications` /
 * `application_events`. The onboarding flags are computed from real rows now.
 */

type ProfileFlagsRow = {
  resume_pdf_url: string | null;
  job_titles_seeking: string[] | null;
};

const EMPTY_SUMMARY: Omit<SidebarSummary, "onboarding" | "newMatches"> = {
  dueCount: 0,
  activeApplications: 0,
  applicationsByStage: { saved: 0, applied: 0, interview: 0, offer: 0 },
  comingUp: [],
};

export async function GET() {
  try {
    const user = await requireUser();
    const insforge = await createInsforgeServer();

    const [profileResult, savedJobResult, newMatchResult] = await Promise.all([
      insforge.database
        .from("profiles")
        .select("resume_pdf_url, job_titles_seeking")
        .eq("id", user.id)
        .maybeSingle<ProfileFlagsRow>(),
      insforge.database
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      insforge.database
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("match_score", NEW_MATCH_SCORE_THRESHOLD),
    ]);

    const profile = profileResult.data;
    const summary: SidebarSummary = {
      ...EMPTY_SUMMARY,
      newMatches: newMatchResult.count ?? 0,
      onboarding: {
        hasResume: Boolean(profile?.resume_pdf_url),
        hasTargetRoles: (profile?.job_titles_seeking?.length ?? 0) > 0,
        hasSavedJob: (savedJobResult.count ?? 0) > 0,
      },
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[api/sidebar-summary]", error);
    return NextResponse.json(
      { success: false, error: "Failed to load sidebar summary" },
      { status: 500 },
    );
  }
}