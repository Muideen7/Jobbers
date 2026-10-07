import type { Metadata } from "next";

import {
  ResearchQueue,
  type QueueJob,
} from "@/components/company-research/ResearchQueue";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../../private-metadata";

export const metadata: Metadata = privateMetadata(
  "Research",
  "Roles you opened but have not researched yet — research them before you apply.",
);

/** The queue is view-driven and capped by the 20 viewed ids on the client. */
const QUEUE_LIMIT = 100;

export default async function CompanyResearchPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: jobRows } = await insforge.database
    .from("jobs")
    .select("id, title, company, location, found_at, match_score")
    .eq("user_id", user.id)
    .is("company_research", null)
    .order("match_score", { ascending: false, nullsFirst: false })
    .limit(QUEUE_LIMIT)
    .returns<QueueJob[]>();

  const jobs = jobRows ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Research
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
            The roles you have opened, waiting on a company dossier. Research a
            company here so you can apply informed instead of blind.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-text-dark">
              Viewed, awaiting research
            </h2>
          </div>

          <ResearchQueue jobs={jobs} />
        </section>
      </div>
    </div>
  );
}