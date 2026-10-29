export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { IntegrationsClient } from "@/components/integrations/IntegrationsClient";
import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Application, Interview, IntegrationsState, UserIntegration } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Integrations",
  "Connect Google Calendar, Apple Calendar, and Outlook to sync interview dates and track job application stages.",
);

export default async function IntegrationsPage() {
  const user = await requireUser();
  const headersList = await headers();
  const host = headersList.get("host") || "jobbers.io";
  const protocol = headersList.get("x-forwarded-proto") || "https";

  const [interviewsColl, appsColl, accountColl, integrationsColl] = await Promise.all([
    getCollection<Interview>("interviews"),
    getCollection<Application>("applications"),
    getCollection("account"),
    getCollection<UserIntegration>("integrations"),
  ]);

  const [
    interviewCount,
    trackedInterviewRolesCount,
    appliedRolesCount,
    googleAccount,
    userIntegrations,
  ] = await Promise.all([
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
    accountColl.findOne({
      userId: user.id,
      providerId: "google",
    }),
    integrationsColl.find({ user_id: user.id }).toArray(),
  ]);

  const feedUrl = `${protocol}://${host}/api/calendar/feed?token=${user.id}`;

  const gCalRecord = userIntegrations.find((i) => i.provider === "google_calendar");
  const icalRecord = userIntegrations.find((i) => i.provider === "ical_feed");
  const pipelineRecord = userIntegrations.find((i) => i.provider === "pipeline_sync");

  const initialIntegrations: IntegrationsState = {
    googleCalendar: {
      connected: Boolean(googleAccount) || (gCalRecord?.connected ?? false),
      accountEmail:
        gCalRecord?.account_identifier || (googleAccount ? user.email : null),
      lastSyncedAt: gCalRecord?.last_synced_at || null,
    },
    icalFeed: {
      connected: (icalRecord?.sync_count ?? 0) > 0 || (icalRecord?.connected ?? false),
      syncCount: icalRecord?.sync_count ?? 0,
      lastSyncedAt: icalRecord?.last_synced_at || null,
      clientName: (icalRecord?.metadata?.client_name as string) || null,
    },
    pipelineSync: {
      enabled: pipelineRecord ? (pipelineRecord.enabled ?? true) : true,
      updatedAt: pipelineRecord?.updated_at || null,
    },
    emailService: {
      connected: Boolean(user.email),
      email: user.email || null,
      isVerified: Boolean(user.emailVerified),
    },
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <IntegrationsClient
        interviewCount={interviewCount}
        trackedInterviewRolesCount={trackedInterviewRolesCount}
        appliedRolesCount={appliedRolesCount}
        feedUrl={feedUrl}
        initialIntegrations={initialIntegrations}
      />
    </div>
  );
}
