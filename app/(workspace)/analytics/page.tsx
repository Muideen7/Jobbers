export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Analytics",
  "Track job discovery, match quality and company research activity.",
);

export default async function AnalyticsRoute() {
  const user = await requireUser();
  const jobsCollection = await getCollection<Job>("jobs");

  const jobs = await jobsCollection
    .find(
      { user_id: user.id },
      {
        projection: {
          id: 1,
          match_score: 1,
          found_at: 1,
          company_research: 1,
          source: 1,
        },
      },
    )
    .sort({ found_at: -1 })
    .toArray();

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <AnalyticsPage jobs={jobs} now={new Date().getTime()} />
    </div>
  );
}
