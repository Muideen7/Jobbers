import type { Metadata } from "next";

import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Analytics",
  "Track job discovery, match quality and company research activity.",
);

export default async function AnalyticsRoute() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: jobRows } = await insforge.database
    .from("jobs")
    .select("id, match_score, found_at, company_research, source")
    .eq("user_id", user.id)
    .order("found_at", { ascending: false })
    .returns<Job[]>();

  const jobs = (jobRows as Job[] | null) ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <AnalyticsPage jobs={jobs} now={new Date().getTime()} />
    </div>
  );
}
