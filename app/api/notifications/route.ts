import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";

/**
 * Recent activity for the dashboard navbar's notification bell: the latest
 * completed agent search runs and company research passes, merged by time.
 * Shared by every page that renders DashboardNav so the bell is identical
 * everywhere (no per-page data plumbing).
 */

type NotificationItem = {
  id: string;
  text: string;
  href: string;
  /** ISO timestamp used for the "unread" badge and relative display. */
  createdAt: string;
};

type AgentRunRow = {
  id: string;
  job_title_searched: string | null;
  jobs_found: number | null;
  completed_at: string | null;
};

type ResearchedJobRow = {
  id: string;
  company: string;
  found_at: string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const insforge = await createInsforgeServer();

    const [runsResult, researchedResult] = await Promise.all([
      insforge.database
        .from("agent_runs")
        .select("id, job_title_searched, jobs_found, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5)
        .returns<AgentRunRow[]>(),
      insforge.database
        .from("jobs")
        .select("id, company, found_at")
        .eq("user_id", user.id)
        .not("company_research", "is", null)
        .order("found_at", { ascending: false })
        .limit(5)
        .returns<ResearchedJobRow[]>(),
    ]);

    const runs = runsResult.data ?? [];
    const researched = researchedResult.data ?? [];

    const runItems: NotificationItem[] = (runs ?? [])
      .filter((r) => r.completed_at)
      .map((r) => ({
        id: `run-${r.id}`,
        text: `Found ${r.jobs_found ?? 0} jobs for ${r.job_title_searched ?? "your search"}`,
        href: "/find-jobs",
        createdAt: r.completed_at!,
      }));

    const researchItems: NotificationItem[] = (researched ?? []).map((j) => ({
      id: `research-${j.id}`,
      text: `Researched ${j.company}`,
      href: `/find-jobs/${j.id}`,
      createdAt: j.found_at,
    }));

    const items = [...runItems, ...researchItems]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("[api/notifications]", error);
    return NextResponse.json(
      { success: false, error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}