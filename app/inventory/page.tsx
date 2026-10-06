import type { Metadata } from "next";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../private-metadata";
import type { Job, Profile } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Inventory",
  "Every saved role across every source, with research and tailoring status.",
);

/**
 * The full saved-job inventory. Server component fetches everything for the
 * account; search and status filtering happen client-side in InventoryClient.
 */
export default async function InventoryPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const [{ data: profile }, { data: jobRows }] = await Promise.all([
    insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    insforge.database
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("found_at", { ascending: false })
      .range(0, 499)
      .returns<Job[]>(),
  ]);

  return (
    <>
      <PostHogIdentify userId={user.id} />
      <DashboardNav
        user={{
          name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        }}
      />
      <main className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <InventoryClient jobs={jobRows ?? []} />
      </main>
    </>
  );
}