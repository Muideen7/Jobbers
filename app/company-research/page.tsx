import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileText } from "lucide-react";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { formatDate, getInitials } from "@/lib/utils";
import { privateMetadata } from "../private-metadata";
import type { Job, Profile } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Company Research",
  "Browserbase dossier for every company you are interviewing with, and one-click research for the rest.",
);

type ResearchJob = Pick<
  Job,
  | "id"
  | "title"
  | "company"
  | "location"
  | "found_at"
  | "company_research"
  | "match_score"
>;

export default async function CompanyResearchPage() {
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
      .select("id, title, company, location, found_at, company_research, match_score")
      .eq("user_id", user.id)
      .order("found_at", { ascending: false })
      .range(0, 499)
      .returns<ResearchJob[]>(),
  ]);

  const jobs = jobRows ?? [];
  const researched = jobs.filter((job) => job.company_research !== null);
  const unResearched = jobs.filter((job) => job.company_research === null);

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
        <div className="flex flex-col gap-10">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Company Research
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
              Every dossier is built live with Browserbase: culture, tech stack,
              interview prep and smart questions for the people you are about to
              talk to.
            </p>
          </header>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-text-dark">
              Saved dossiers{" "}
              <span className="font-normal text-text-secondary">
                ({researched.length})
              </span>
            </h2>

            {researched.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
                  <Building2 className="h-5 w-5 text-text-muted" />
                </div>
                <p className="mt-3 text-sm font-medium text-text-primary">
                  No dossiers yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-text-muted">
                  Run research from a saved job below and its dossier will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {researched.map((job) => (
                  <article
                    key={job.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                          {getInitials(job.company ?? "?")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-4 text-text-primary">
                            {job.company ?? "Unknown company"}
                          </p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {formatDate(job.found_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Researched</Badge>
                    </div>

                    <p className="line-clamp-3 text-sm leading-6 text-text-secondary">
                      {job.company_research?.companyOverview ??
                        "Dossier ready — open it from the job detail page."}
                    </p>

                    <Link
                      href={`/find-jobs/${job.id}`}
                      className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-dark"
                    >
                      Open dossier
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-text-dark">
              Run a research pass{" "}
              <span className="font-normal text-text-secondary">
                ({unResearched.length})
              </span>
            </h2>

            {unResearched.length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface p-6 text-sm leading-6 text-text-muted shadow-card">
                Every saved company has been researched. 🎉
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {unResearched.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                        <FileText className="h-4 w-4 text-text-muted" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-4 text-text-primary">
                          {job.title ?? "Untitled role"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-text-muted">
                          {job.company ?? "Unknown company"}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 sm:pl-4">
                      <ResearchCompanyButton jobId={job.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}