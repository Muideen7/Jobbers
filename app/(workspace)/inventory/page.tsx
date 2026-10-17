export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { InventoryClient } from "@/components/inventory/InventoryClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

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
  const jobsCollection = await getCollection<Job>("jobs");

  const jobs = await jobsCollection
    .find({ user_id: user.id })
    .sort({ found_at: -1 })
    .limit(500)
    .toArray();

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <InventoryClient jobs={serializeMongo(jobs ?? [])} />
    </div>
  );
}