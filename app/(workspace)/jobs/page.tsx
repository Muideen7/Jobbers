export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { FindJobsClient } from "@/components/find-jobs/FindJobsClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Find Jobs",
  "Search and filter open roles, scored against your Jobbers profile.",
);

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function FindJobsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: jobs, count } = await insforge.database
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("match_score", { ascending: false, nullsFirst: false })
    .range(0, 99)
    .returns<Job[]>();

  const initialJobs = (jobs as Job[] | null) ?? [];
  const initialTotalCount = count ?? initialJobs.length;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <FindJobsClient
        initialJobs={initialJobs}
        initialTotalCount={initialTotalCount}
        initialQuery={q}
      />
    </div>
  );
}