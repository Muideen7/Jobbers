import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { AgentRun, Job } from "@/types";

type NotificationItem = {
  id: string;
  text: string;
  href: string;
  createdAt: string;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const runsCollection = await getCollection<AgentRun>("agent_runs");
    const jobsCollection = await getCollection<Job>("jobs");

    const [runs, researched] = await Promise.all([
      runsCollection
        .find({ user_id: user.id, status: "completed" })
        .sort({ completed_at: -1 })
        .limit(5)
        .toArray(),
      jobsCollection
        .find({ user_id: user.id, company_research: { $exists: true, $ne: null } })
        .sort({ found_at: -1 })
        .limit(5)
        .toArray(),
    ]);

    const runItems: NotificationItem[] = runs
      .filter((r) => r.completed_at)
      .map((r) => ({
        id: `run-${r.id}`,
        text: `Found ${r.jobs_found ?? 0} jobs for ${r.job_title_searched ?? "your search"}`,
        href: "/jobs",
        createdAt: r.completed_at!,
      }));

    const researchItems: NotificationItem[] = researched.map((j) => ({
      id: `research-${j.id}`,
      text: `Researched ${j.company ?? "Company"}`,
      href: `/jobs/${j.id}`,
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