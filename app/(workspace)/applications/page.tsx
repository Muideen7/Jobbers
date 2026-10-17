export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { ApplicationsPageClient } from "@/components/applications/ApplicationsPageClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { applicationStageRank } from "@/lib/workspace/application-rules";
import { privateMetadata } from "../../private-metadata";
import type { Application, ApplicationJobSummary, ApplicationListItem } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Applications",
  "Track your job application pipeline across every stage.",
);

export default async function ApplicationsPage() {
  const user = await requireUser();
  const applicationRows = await (await getCollection<Application>('applications')).find({ user_id: user.id }).toArray();

  const applications = (applicationRows as Application[] | null) ?? [];

  const jobIds = [...new Set(applications.map((app) => app.job_id))];
  const jobs: ApplicationJobSummary[] = [];
  if (jobIds.length > 0) {
    const jobRows = await (await getCollection<ApplicationJobSummary>('jobs')).find({ user_id: user.id, id: { $in: jobIds } }).toArray();

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

  return <ApplicationsPageClient initialApplications={serializeMongo(items)} />;
}