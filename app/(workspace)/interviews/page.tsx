export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { InterviewsClient, type TrackedPipelineRole } from "@/components/interviews/InterviewsClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Application, Interview, Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Interviews & Calendar",
  "Track upcoming interview rounds, store meeting links, and sync with your calendar in 1 click.",
);

export default async function InterviewsPage() {
  const user = await requireUser();
  const headersList = await headers();
  const host = headersList.get("host") || "jobbers.io";
  const protocol = headersList.get("x-forwarded-proto") || "https";

  const [interviewsColl, jobsColl, appsColl] = await Promise.all([
    getCollection<Interview>("interviews"),
    getCollection<Job>("jobs"),
    getCollection<Application>("applications"),
  ]);

  const [interviews, savedJobs, applications] = await Promise.all([
    interviewsColl.find({ user_id: user.id }).sort({ interview_at: 1 }).toArray(),
    jobsColl
      .find({ user_id: user.id })
      .project({ id: 1, title: 1, company: 1, match_score: 1, location: 1 })
      .limit(60)
      .toArray() as Promise<unknown> as Promise<Job[]>,
    appsColl
      .find({ user_id: user.id, status: { $in: ["interview", "applied"] } })
      .sort({ updated_at: -1 })
      .toArray(),
  ]);

  const jobMap = new Map((savedJobs ?? []).map((j) => [j.id, j]));

  // Build pipeline roles enriched with their scheduled interviews
  const pipelineRoles: TrackedPipelineRole[] = (applications ?? [])
    .map((app) => {
      const job = jobMap.get(app.job_id);
      const matchingInterviews = (interviews ?? []).filter(
        (i) => i.job_id === app.job_id && i.status !== "cancelled",
      );

      const nextInterview =
        matchingInterviews.length > 0
          ? matchingInterviews.sort(
              (a, b) =>
                new Date(a.interview_at).getTime() -
                new Date(b.interview_at).getTime(),
            )[0]
          : null;

      return {
        application_id: app.id,
        job_id: app.job_id,
        company: job?.company || "Unknown Company",
        title: job?.title || "Untitled Role",
        status: app.status as "interview" | "applied",
        match_score: job?.match_score ?? null,
        scheduledInterviewCount: matchingInterviews.length,
        nextInterviewAt: nextInterview ? nextInterview.interview_at : null,
        nextRoundType: nextInterview ? nextInterview.round_type : null,
      };
    })
    .sort((a, b) => {
      // Prioritize roles in 'interview' stage that have NO date scheduled yet
      if (a.status === "interview" && a.scheduledInterviewCount === 0) return -1;
      if (b.status === "interview" && b.scheduledInterviewCount === 0) return 1;
      return 0;
    });

  const feedUrl = `${protocol}://${host}/api/calendar/feed?token=${user.id}`;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <InterviewsClient
        initialInterviews={serializeMongo(interviews ?? [])}
        savedJobs={serializeMongo(savedJobs ?? [])}
        pipelineRoles={serializeMongo(pipelineRoles)}
        feedUrl={feedUrl}
      />
    </div>
  );
}
