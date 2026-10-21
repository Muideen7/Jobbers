export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { IntegrationsClient } from "@/components/integrations/IntegrationsClient";
import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Application, Interview } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Integrations",
  "Connect Google Calendar, Apple Calendar, and Outlook to sync interview dates and track job application stages.",
);

export default async function IntegrationsPage() {
  const user = await requireUser();
  const headersList = await headers();
  const host = headersList.get("host") || "jobbers.io";
  const protocol = headersList.get("x-forwarded-proto") || "https";

  const [interviewsColl, appsColl] = await Promise.all([
    getCollection<Interview>("interviews"),
    getCollection<Application>("applications"),
  ]);

  const [interviewCount, trackedInterviewRolesCount, appliedRolesCount] =
    await Promise.all([
      interviewsColl.countDocuments({
        user_id: user.id,
        status: { $ne: "cancelled" },
      }),
      appsColl.countDocuments({
        user_id: user.id,
        status: "interview",
      }),
      appsColl.countDocuments({
        user_id: user.id,
        status: "applied",
      }),
    ]);

  const feedUrl = `${protocol}://${host}/api/calendar/feed?token=${user.id}`;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <IntegrationsClient
        interviewCount={interviewCount}
        trackedInterviewRolesCount={trackedInterviewRolesCount}
        appliedRolesCount={appliedRolesCount}
        feedUrl={feedUrl}
      />
    </div>
  );
}
