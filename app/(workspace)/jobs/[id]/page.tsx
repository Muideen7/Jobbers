export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";

import { notFound } from "next/navigation";

import { JobActions } from "@/components/job-details/JobActions";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchReasonCard, SkillMatchCard } from "@/components/job-details/MatchScore";
import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { RecordJobView } from "@/components/find-jobs/RecordJobView";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Job Details",
  "Match score, requirements breakdown and application links for this role.",
);

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailsPage({ params }: Props) {
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
    console.error("[find-jobs/id]", error);
  }

  if (error || !job) {
    notFound();
  }

  const company = job.company ?? "this company";
  const applyUrl = job.external_apply_url ?? job.source_url;
  const hasResearch = job.company_research !== null;

  return (
    <>
      <RecordJobView jobId={job.id} />
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <JobActions applyUrl={applyUrl} company={company} showBackLink />
          <JobInfo job={job} />

          {/* Job-only view: description reads as the main card, the match and
              apply actions sit in the side rail. Company research lives on the
              dossier page. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="flex flex-col gap-6 lg:order-2 lg:col-span-1">
              <MatchReasonCard matchReason={job.match_reason} />
              <SkillMatchCard
                matchedSkills={job.matched_skills}
                missingSkills={job.missing_skills}
              />

              {/* Apply + Research — immediately after Required Skills vs Your Profile */}
              <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <h2 className="text-base font-semibold leading-6 text-text-primary">
                  Ready to apply?
                </h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {hasResearch
                    ? `Your dossier for ${company} is ready — review it, then apply.`
                    : `Research ${company} before you send your application.`}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <ResearchCompanyButton jobId={job.id} fullWidth />
                  {hasResearch && (
                    <Link
                      href={`/jobs/${job.id}?tab=company`}
                      className="btn btn-secondary w-full whitespace-nowrap"
                    >
                      View company dossier
                    </Link>
                  )}
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
            </div>

            <div className="lg:order-1 lg:col-span-2">
              <JobDescription
                aboutRole={job.about_role}
                responsibilities={job.responsibilities}
                requirements={job.requirements}
                niceToHave={job.nice_to_have}
                benefits={job.benefits}
                sourceUrl={applyUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}