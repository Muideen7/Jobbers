export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

import { notFound } from "next/navigation";

import {
  CompanyResearch,
  GapsToAddressCard,
  YourEdgeCard,
} from "@/components/job-details/CompanyResearch";
import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getInitials, getMatchBadgeVariant } from "@/lib/utils";
import { privateMetadata } from "../../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Company Dossier",
  "AI research, candidate fit, gaps to address and questions to ask for this role.",
);

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DossierPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const insforge = await createInsforgeServer();

  const { data: job, error } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<Job>();

  if (error) {
    console.error("[dossiers/id]", error);
  }

  if (error || !job) {
    notFound();
  }

  const company = job.company ?? "this company";
  const applyUrl = job.external_apply_url ?? job.source_url;
  const research = job.company_research;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <Link
          href="/jobs?tab=all&researched=1"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All dossiers
        </Link>

        {/* Dossier header — company + the role the research was built for. */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-accent-muted text-base font-bold text-accent">
                {getInitials(company)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold leading-8 text-text-primary">
                    {company}
                  </h1>
                  <Badge variant={getMatchBadgeVariant(job.match_score)}>
                    {job.match_score !== null
                      ? `${job.match_score}% Match`
                      : "Not scored"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-text-secondary">
                  {job.title ?? "Untitled role"}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link
                href={`/jobs/${job.id}`}
                className="btn btn-secondary whitespace-nowrap"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                View role
              </Link>
              <Link
                href={applyUrl ?? "/jobs"}
                target={applyUrl ? "_blank" : undefined}
                rel={applyUrl ? "noreferrer" : undefined}
                className="btn btn-primary whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4" />
                Apply Now
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {/* Candidate-fit rail: apply action first, then your edge and gaps. */}
          <div className="flex flex-col gap-6 lg:order-2 lg:col-span-1">
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h2 className="text-base font-semibold leading-6 text-text-primary">
                Ready to apply?
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {research
                  ? `Use your ${company} dossier to shape the application, then send it in.`
                  : `Research ${company} before you send your application.`}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {research === null && <ResearchCompanyButton jobId={job.id} />}
                <Link
                  href={applyUrl ?? "/jobs"}
                  target={applyUrl ? "_blank" : undefined}
                  rel={applyUrl ? "noreferrer" : undefined}
                  className="btn btn-primary w-full whitespace-nowrap"
                >
                  Apply Now at {company}
                </Link>
              </div>
            </section>

            {research && (
              <>
                <YourEdgeCard items={research.yourEdge} />
                <GapsToAddressCard items={research.gapsToAddress} />
              </>
            )}
          </div>

          <div className="lg:order-1 lg:col-span-2">
            {research ? (
              <CompanyResearch
                company={company}
                jobId={job.id}
                research={research}
                showResearchButton={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
                  No dossier yet
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
                  Research {company} to build a candidate-specific briefing with
                  your edge, the gaps to address and questions to ask.
                </p>
                <div className="mt-5">
                  <ResearchCompanyButton jobId={job.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}