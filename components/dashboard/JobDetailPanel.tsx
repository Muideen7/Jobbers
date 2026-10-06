"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  DollarSign,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";

import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { MatchScore } from "@/components/job-details/MatchScore";
import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";
import type { Job } from "@/types";

type Props = {
  job: Job | null;
};

function InfoChip({ icon, children }: { icon: "map" | "pay"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
      {icon === "map" ? <MapPin className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
      {children}
    </h3>
  );
}

function EmptyState() {
  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-ink bg-surface p-6 py-16 text-center shadow-sm xl:sticky xl:top-[5.5rem]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
        <Sparkles className="h-6 w-6 text-text-muted" />
      </div>
      <p className="mt-5 text-sm font-semibold text-text-primary">No job selected</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
        Select a job card to preview its Gemini match analysis and company
        dossier here.
      </p>
    </section>
  );
}

/**
 * Right column of the dashboard workspace: a "quick view" of the selected job
 * with match analysis, the Browserbase company dossier, and the action row
 * ([Tailor Resume PDF] — disabled, [Research Company], [Apply via Source]).
 */
export function JobDetailPanel({ job }: Props) {
  if (!job) return <EmptyState />;

  const company = job.company ?? "Unknown company";
  const title = job.title ?? "Untitled role";

  return (
    <section className="overflow-hidden rounded-2xl border border-ink bg-surface shadow-sm xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)]">
      <ScrollArea className="xl:h-[calc(100vh-7rem)]">
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-sm font-bold text-accent">
                {getInitials(company)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-6 text-text-primary">
                  {company}
                </h2>
                <p className="truncate text-sm text-text-secondary">{title}</p>
              </div>
            </div>
            <Badge variant={getMatchBadgeVariant(job.match_score)}>
              {job.match_score !== null ? `${job.match_score}%` : "—"} Match
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.location && <InfoChip icon="map">{job.location}</InfoChip>}
            {job.salary && <InfoChip icon="pay">{job.salary}</InfoChip>}
          </div>

          <div className="flex flex-col gap-4">
            <SectionLabel>Gemini Match Analysis</SectionLabel>
            <MatchScore
              matchReason={job.match_reason}
              matchedSkills={job.matched_skills}
              missingSkills={job.missing_skills}
            />
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Company Dossier</SectionLabel>
            <CompanyResearch
              company={company}
              jobId={job.id}
              research={job.company_research}
              showResearchButton={false}
            />
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Actions</SectionLabel>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                disabled
                title="Resume tailoring is coming soon"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tailor Resume PDF
                </span>
                <span className="text-xs font-medium opacity-70">Coming soon</span>
              </Button>

              <div className="[&_button]:w-full">
                <ResearchCompanyButton jobId={job.id} />
              </div>

              {job.external_apply_url ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={job.external_apply_url} target="_blank" rel="noreferrer">
                    <ArrowUpRight className="h-4 w-4" />
                    Apply via Source
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/find-jobs/${job.id}`}>Apply via Jobbers</Link>
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-text-muted">
            Found {formatDate(job.found_at)}
          </p>
        </div>
      </ScrollArea>
    </section>
  );
}