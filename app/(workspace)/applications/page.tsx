import type { Metadata } from "next";

import { ApplicationsPageClient } from "@/components/applications/ApplicationsPageClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { applicationStageRank } from "@/lib/workspace/application-rules";
import { privateMetadata } from "../../private-metadata";
import type { Application, ApplicationJobSummary, ApplicationListItem } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Applications",
  "Track your job application pipeline across every stage.",
);

const JOB_SUMMARY_COLUMNS = "id, title, company, location, source, match_score, company_research";

export default async function ApplicationsPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: applicationRows } = await insforge.database
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  const applications = (applicationRows as Application[] | null) ?? [];

  const jobIds = [...new Set(applications.map((app) => app.job_id))];
  const jobs: ApplicationJobSummary[] = [];
  if (jobIds.length > 0) {
    const { data: jobRows } = await insforge.database
      .from("jobs")
      .select(JOB_SUMMARY_COLUMNS)
      .eq("user_id", user.id)
      .in("id", jobIds);

    jobs.push(...((jobRows as ApplicationJobSummary[] | null) ?? []));
  }

  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const items: ApplicationListItem[] = applications
    .map((app) => ({
      ...app,
      job: jobById.get(app.job_id) ?? null,
    }))
    .sort(
      (a, b) =>
        applicationStageRank(a.status) - applicationStageRank(b.status) ||
        a.position - b.position ||
        a.created_at.localeCompare(b.created_at),
    );

  return <ApplicationsPageClient initialApplications={items} />;
}