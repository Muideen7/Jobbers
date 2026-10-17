export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";

import { notFound } from "next/navigation";

import { ObjectId, type Filter } from "mongodb";

import { ApplyNowButton } from "@/components/job-details/ApplyNowButton";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchReasonCard, SkillMatchCard } from "@/components/job-details/MatchScore";
import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { RecordJobView } from "@/components/find-jobs/RecordJobView";
import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/profile";
import { keywordScore } from "@/lib/jobs/keyword-score";
import type { NormalizedJob } from "@/lib/jobs/types";
import type { Application } from "@/types";
import { privateMetadata } from "../../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Job Details",
  "Match score, requirements breakdown and application links for this role.",
);

type Props = {
  params: Promise<{ id: string }>;
};

type JobDoc = Job & {
  _id?: ObjectId | string;
};

export default async function JobDetailsPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const jobsCollection = await getCollection<JobDoc>("jobs");

  const idFilters: Filter<JobDoc>[] = [{ id } as Filter<JobDoc>];
  if (ObjectId.isValid(id)) {
    idFilters.push({ _id: new ObjectId(id) } as Filter<JobDoc>);
  }

  let rawJob = await jobsCollection.findOne({
    $or: idFilters,
    user_id: user.id,
  });

  if (!rawJob) {
    rawJob = await jobsCollection.findOne({
      $or: idFilters,
    });
  }

  if (!rawJob) {
    notFound();
  }

  const job: Job = {
    ...rawJob,
    id: rawJob.id || (rawJob._id ? String(rawJob._id) : id),
  };

  // Re-score dynamically against current profile so added skills immediately reflect
  const profile = await getUserProfile(user.id);
  if (
    profile &&
    ((profile.skills && profile.skills.length > 0) ||
      profile.current_title ||
      (profile.job_titles_seeking && profile.job_titles_seeking.length > 0))
  ) {
    const normalized: NormalizedJob = {
      source: (job.source ?? "jsearch") as NormalizedJob["source"],
      externalId: job.id,
      title: job.title ?? "Untitled Role",
      company: job.company ?? "",
      location: job.location ?? "",
      description: job.about_role ?? "",
      applyUrl: job.external_apply_url ?? job.source_url ?? "",
      sourceUrl: job.source_url ?? "",
      salaryMin: null,
      salaryMax: null,
      salaryPeriod: null,
      salaryText: job.salary ?? null,
      postedAt: job.found_at,
      employmentType: job.job_type,
      remote: /remote/i.test(job.location ?? ""),
      category: null,
      highlights: {
        responsibilities: job.responsibilities ?? [],
        requirements: job.requirements ?? [],
        benefits: job.benefits ?? [],
      },
    };

    const rescore = keywordScore(normalized, {
      location: profile.location,
      experience_level: profile.experience_level,
      years_experience: profile.years_experience,
      skills: profile.skills ?? [],
      industries: profile.industries ?? [],
      work_experience: profile.work_experience,
      job_titles_seeking: profile.job_titles_seeking ?? [],
      remote_preference: profile.remote_preference,
      preferred_locations: profile.preferred_locations ?? [],
      salary_expectation: profile.salary_expectation,
    });

    job.match_score = rescore.matchScore;
    job.match_reason = rescore.matchReason;
    job.matched_skills = rescore.matchedSkills;
    job.missing_skills = rescore.missingSkills;

    if (rawJob.user_id === user.id && rawJob._id && typeof rawJob._id !== "string") {
      jobsCollection.updateOne(
        { _id: rawJob._id },
        {
          $set: {
            match_score: rescore.matchScore,
            match_reason: rescore.matchReason,
            matched_skills: rescore.matchedSkills,
            missing_skills: rescore.missingSkills,
          },
        },
      ).catch(() => {});
    }
  }

  const applicationsCollection = await getCollection<Application>("applications");
  const existingApp = await applicationsCollection.findOne({
    user_id: user.id,
    job_id: job.id,
  });
  const isApplied = existingApp?.status === "applied";

  const company = job.company ?? "this company";
  const applyUrl = job.external_apply_url ?? job.source_url;
  const hasResearch = Boolean(job.company_research);

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
                  <ApplyNowButton
                    jobId={job.id}
                    applyUrl={applyUrl ?? "/jobs"}
                    company={company}
                    initialApplied={isApplied}
                  />
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