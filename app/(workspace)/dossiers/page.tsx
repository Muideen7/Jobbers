import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Dossiers",
  "Every company you have researched, with the role it was built for.",
);

/** Upper bound so the dossier wall stays responsive for heavy users. */
const DOSSIER_LIMIT = 60;

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

export default async function DossiersPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: jobRows } = await insforge.database
    .from("jobs")
    .select("id, title, company, location, found_at, company_research, match_score")
    .eq("user_id", user.id)
    .not("company_research", "is", null)
    .order("match_score", { ascending: false, nullsFirst: false })
    .limit(DOSSIER_LIMIT)
    .returns<ResearchJob[]>();

  const dossiers = jobRows ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Company Dossiers
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
            Every company you have researched, ranked by AI match score. Open a
            dossier to review your edge, the gaps to address and the questions
            to ask before you apply.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-text-dark">
              Researched companies
            </h2>
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-text-secondary">
              {dossiers.length}
            </span>
          </div>

          {dossiers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <p className="mt-3 text-sm font-medium text-text-primary">
                No dossiers yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-text-muted">
                Research a company from the{" "}
                <Link
                  href="/jobs?tab=all"
                  className="font-medium text-accent hover:text-accent-dark"
                >
                  Research
                </Link>{" "}
                queue and its dossier will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dossiers.map((job) => {
                const company = job.company ?? "Unknown company";

                return (
                  <article
                    key={job.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-border-muted hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                          {getInitials(company)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-4 text-text-primary">
                            {job.title ?? "Untitled role"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-text-muted">
                            {company}
                            {job.location ? ` · ${job.location}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={getMatchBadgeVariant(job.match_score)}
                        className="shrink-0 text-[11px]"
                      >
                        {job.match_score !== null
                          ? `${job.match_score}% Match`
                          : "Not scored"}
                      </Badge>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-surface-secondary/40 p-3">
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          Location
                        </dt>
                        <dd className="mt-0.5 truncate text-xs font-medium text-text-primary">
                          {job.location ?? "—"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          Found
                        </dt>
                        <dd className="mt-0.5 truncate text-xs font-medium text-text-primary">
                          {formatDate(job.found_at)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3.5">
                      <Link
                        href={`/jobs/${job.id}?tab=company`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-dark"
                      >
                        Open dossier
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <Badge variant="success" className="gap-1">
                        <FileText className="h-3 w-3" />
                        Researched
                      </Badge>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}