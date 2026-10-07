"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Code2,
  DollarSign,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildRoleSummary } from "@/lib/role-summary";
import { formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";
import type { Job } from "@/types";

type Props = {
  job: Job | null;
  onClose?: () => void;
};

function InfoChip({ icon, children }: { icon: "map" | "pay"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary/80 px-2.5 py-1 text-xs font-medium text-text-secondary">
      {icon === "map" ? <MapPin className="h-3 w-3 shrink-0" /> : <DollarSign className="h-3 w-3 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
      {children}
    </h3>
  );
}

function EmptyState() {
  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6 py-20 text-center shadow-card xl:sticky xl:top-[5.5rem]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
        <Sparkles className="h-6 w-6 text-text-muted" />
      </div>
      <p className="mt-4 text-sm font-semibold text-text-primary">Select a job</p>
      <p className="mt-1.5 max-w-xs text-xs text-text-muted leading-relaxed">
        Click any position in the feed to preview its AI match analysis, role description, and company dossier.
      </p>
    </section>
  );
}

/**
 * Clean, cohesive right column for the discovery workspace:
 * Unifies role summary, AI match breakdown, company research, and instant actions
 * without nesting bulky cards inside cards.
 */
export function JobDetailPanel({ job, onClose }: Props) {
  if (!job) return <EmptyState />;

  const company = job.company ?? "Unknown company";
  const title = job.title ?? "Untitled role";
  const research = job.company_research;
  const hasResearch = research !== null;
  const roleSummary = buildRoleSummary(job);

  return (
    <aside className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)] flex flex-col">
      <ScrollArea className="xl:h-[calc(100vh-7rem)]">
        <div className="flex flex-col gap-5 p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary border border-border/80 text-sm font-bold text-text-primary">
                {getInitials(company)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold leading-tight text-text-primary">
                  {title}
                </h2>
                <p className="truncate text-xs font-semibold text-text-secondary mt-0.5">
                  {company}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Found {formatDate(job.found_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={getMatchBadgeVariant(job.match_score)} className="shrink-0">
                {job.match_score !== null ? `${job.match_score}% Match` : "Not scored"}
              </Badge>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors cursor-pointer"
                  aria-label="Close detail preview"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Info Tags */}
          <div className="flex flex-wrap gap-1.5">
            {job.location && <InfoChip icon="map">{job.location}</InfoChip>}
            {job.salary && <InfoChip icon="pay">{job.salary}</InfoChip>}
            <span className="inline-flex items-center rounded-full bg-surface-secondary/80 px-2.5 py-1 text-xs font-medium capitalize text-text-secondary">
              {job.job_type ?? "Full-time"}
            </span>
          </div>

          {/* Actions Row */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary/40 p-3 border border-border/50">
            {job.external_apply_url ? (
              <Button asChild size="sm" className="w-full justify-center gap-1.5 rounded-full font-semibold">
                <Link href={job.external_apply_url} target="_blank" rel="noreferrer">
                  Apply via Source
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 rounded-full text-xs">
                <Link href={`/jobs/${job.id}`}>
                  Full Details
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>

              {!hasResearch && (
                <div className="flex-1 [&_button]:w-full [&_button]:h-8 [&_button]:text-xs [&_button]:rounded-full">
                  <ResearchCompanyButton jobId={job.id} />
                </div>
              )}
            </div>
          </div>

          {/* Role Summary — role-focused preview, capped at ROLE_SUMMARY_MAX_WORDS */}
          {roleSummary && (
            <div className="flex flex-col gap-2">
              <SectionHeading>Role Summary</SectionHeading>
              <p className="rounded-xl bg-surface-secondary/40 p-3.5 border border-border/50 text-xs text-text-primary leading-relaxed">
                {roleSummary}
              </p>
              <p className="text-[11px] text-text-muted">
                Full description lives on the source listing — use Apply via Source above.
              </p>
            </div>
          )}

          {/* AI Match Analysis */}
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
            <SectionHeading>
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Gemini Match Analysis
            </SectionHeading>

            {job.match_reason ? (
              <p className="rounded-xl bg-surface-secondary/50 p-3 text-xs leading-relaxed text-text-primary border border-border/40">
                {job.match_reason}
              </p>
            ) : null}

            <div className="flex flex-col gap-2.5">
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-text-muted">Matched Skills</p>
                {job.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.matched_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-2.5 py-0.5 text-[11px] font-medium text-success-foreground"
                      >
                        <Check className="h-3 w-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No matched skills recorded.</p>
                )}
              </div>

              {job.missing_skills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-text-muted">Gap Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missing_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-0.5 text-[11px] font-medium text-accent"
                      >
                        <X className="h-3 w-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company Dossier */}
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <SectionHeading>Company Dossier</SectionHeading>
              {hasResearch && (
                <span className="text-[11px] font-medium text-info-medium">Researched</span>
              )}
            </div>

            {hasResearch && research ? (
              <div className="flex flex-col gap-3 text-xs">
                {research.companyOverview && (
                  <div className="rounded-xl bg-surface-secondary/40 p-3 border border-border/40">
                    <p className="font-semibold text-text-primary mb-1">Overview</p>
                    <p className="text-text-secondary leading-relaxed">{research.companyOverview}</p>
                  </div>
                )}

                {research.techStack && research.techStack.length > 0 && (
                  <div>
                    <p className="font-semibold text-text-primary mb-1.5 flex items-center gap-1">
                      <Code2 className="h-3 w-3 text-accent" />
                      Tech Stack
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {research.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-medium text-accent"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {research.culture && research.culture.length > 0 && (
                  <div className="rounded-xl bg-surface-secondary/40 p-3 border border-border/40">
                    <p className="font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3 text-info-medium" />
                      Culture & Values
                    </p>
                    <ul className="space-y-1 text-text-secondary">
                      {research.culture.slice(0, 3).map((item) => (
                        <li key={item} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-info-medium" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {research.yourEdge && research.yourEdge.length > 0 && (
                  <div className="rounded-xl bg-success-lightest/50 p-3 border border-success-light">
                    <p className="font-semibold text-success-foreground mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      Your Edge
                    </p>
                    <ul className="space-y-1 text-text-primary">
                      {research.yourEdge.slice(0, 3).map((edge) => (
                        <li key={edge} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />
                          <span>{edge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-surface-secondary/40 p-3.5 border border-border/50 text-center">
                <p className="text-xs font-semibold text-text-primary">No research dossier yet</p>
                <p className="mt-1 text-[11px] text-text-muted leading-relaxed">
                  Run the research agent from the actions above to extract {company}&apos;s tech stack, culture, and interview prep.
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}