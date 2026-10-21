export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { FollowUpsClient } from "@/components/follow-ups/FollowUpsClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Communication, Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Follow-ups & Communications",
  "Track recruiter emails, responses, deadlines, and generate 1-click follow-up drafts.",
);

export default async function FollowUpsPage() {
  const user = await requireUser();

  const [commsColl, jobsColl] = await Promise.all([
    getCollection<Communication>("communications"),
    getCollection<Job>("jobs"),
  ]);

  const [communications, savedJobs] = await Promise.all([
    commsColl.find({ user_id: user.id }).sort({ occurred_at: -1 }).toArray(),
    jobsColl
      .find({ user_id: user.id })
      .project({ id: 1, title: 1, company: 1 })
      .limit(50)
      .toArray() as Promise<unknown> as Promise<Job[]>,
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <FollowUpsClient
        initialCommunications={serializeMongo(communications ?? [])}
        savedJobs={serializeMongo(savedJobs ?? [])}
      />
    </div>
  );
}

