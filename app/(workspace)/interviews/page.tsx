export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { InterviewsClient } from "@/components/interviews/InterviewsClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Interview, Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Interviews & Calendar",
  "Track upcoming interview rounds, store meeting links, and sync with your calendar in 1 click.",
);

export default async function InterviewsPage() {
  const user = await requireUser();

  const [interviewsColl, jobsColl] = await Promise.all([
    getCollection<Interview>("interviews"),
    getCollection<Job>("jobs"),
  ]);

  const [interviews, savedJobs] = await Promise.all([
    interviewsColl.find({ user_id: user.id }).sort({ interview_at: 1 }).toArray(),
    jobsColl
      .find({ user_id: user.id })
      .project({ id: 1, title: 1, company: 1 })
      .limit(40)
      .toArray() as Promise<unknown> as Promise<Job[]>,
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <InterviewsClient
        initialInterviews={serializeMongo(interviews ?? [])}
        savedJobs={serializeMongo(savedJobs ?? [])}
      />
    </div>
  );
}

