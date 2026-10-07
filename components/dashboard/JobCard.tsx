import Link from "next/link";
import { ArrowUpRight, Bookmark, CalendarDays, DollarSign, FlaskConical, MapPin, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { isRemoteListing } from "@/lib/dashboard-filters";
import { SOURCE_ATTRIBUTION } from "@/lib/source-attribution";
import type { ApplicationStatus } from "@/lib/workspace/constants";
import type { ApplicationRef, Job } from "@/types";
import { cn, formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";

type Props = {
  job: Job;
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** The row in `applications` for this job, or null when it is not tracked. */
  application: ApplicationRef | null;
  /** True only while this card's own save/unsave request is in flight. */
  isSaving: boolean;
  onToggleSave: (job: Job) => void;
};

type StatusVariant = "secondary" | "info" | "warning" | "success" | "outline";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

const STATUS_VARIANT: Record<ApplicationStatus, StatusVariant> = {
  saved: "secondary",
  applied: "info",
  interview: "warning",
  offer: "success",
  closed: "outline",
};

/**
 * Hand-saved rows carry no provider, so they credit themselves. The fallback
 * also covers `source: "manual"` rows (written by `POST /api/applications`
 * but absent from the `JobSourceId` union).
 */
function sourceLabel(source: Job["source"]): string {
  if (source === "url") return "Saved by you";
  const credit = SOURCE_ATTRIBUTION[source as keyof typeof SOURCE_ATTRIBUTION];
  return credit?.label ?? "Saved by you";
}

function InfoChip({ icon, children }: { icon: "map" | "pay"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary/80 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
      {icon === "map" ? <MapPin className="h-3 w-3 shrink-0" /> : <DollarSign className="h-3 w-3 shrink-0" />}
      <span className="truncate max-w-[140px]">{children}</span>
    </span>
  );
}

/**
 * The single job card used by the merged /jobs feed (all three tabs).
 *
 * The title is the real link, so keyboard and screen-reader users reach
 * `/jobs/[id]` through it; the surrounding card also carries a click for mouse
 * users. The card deliberately does *not* use `role="button"` — a button role
 * marks its descendants as presentational, which would hide the Save toggle and
 * the apply link from assistive tech.
 */
export function JobCard({
  job,
  isSelected,
  onSelect,
  application,
  isSaving,
  onToggleSave,
}: Props) {
  const company = job.company ?? "Unknown company";
  const title = job.title ?? "Untitled role";
  const detailHref = `/jobs/${job.id}`;
  const hasResearch = job.company_research !== null;
  const isRemote = isRemoteListing(job);
  const topSkills = job.matched_skills.slice(0, 2);
  const isSaved = application !== null;

  return (
    <div
      onClick={() => onSelect(job.id)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer shadow-card",
        isSelected
          ? "border-accent bg-accent-muted/15 ring-2 ring-accent/20"
          : "border-border bg-surface hover:border-border-muted hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div>
        {/* Company, posted date and match score */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-secondary border border-border/60 text-xs font-bold text-text-primary">
              {getInitials(company)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold leading-4 text-text-secondary">
                {company}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-text-muted">
                <CalendarDays className="h-3 w-3" aria-hidden="true" />
                {formatDate(job.found_at)}
              </p>
            </div>
          </div>

          <Badge variant={getMatchBadgeVariant(job.match_score)} className="shrink-0 text-[11px]">
            {job.match_score !== null ? `${job.match_score}% Match` : "Not scored"}
          </Badge>
        </div>

        {/* Role title — the accessible route to the detail page */}
        <h3 className="mt-2.5 text-sm sm:text-base font-semibold leading-snug text-text-primary group-hover:text-accent transition-colors line-clamp-1">
          <Link
            href={detailHref}
            onClick={(e) => e.stopPropagation()}
            className="focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent"
          >
            {title}
          </Link>
        </h3>

        {/* Location, remote, salary, research */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {job.location && <InfoChip icon="map">{job.location}</InfoChip>}
          {isRemote && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-light px-2 py-0.5 text-[11px] font-medium text-info-medium">
              <Wifi className="h-3 w-3" aria-hidden="true" />
              Remote
            </span>
          )}
          {job.salary && <InfoChip icon="pay">{job.salary}</InfoChip>}
          {hasResearch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-medium text-accent">
              <FlaskConical className="h-3 w-3" aria-hidden="true" />
              Researched
            </span>
          )}
        </div>

        {/* The two skills that moved the match score */}
        {topSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-text-muted">Top match</span>
            {topSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tracked status, provenance, and the card actions */}
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-1.5">
          {application && (
            <Badge variant={STATUS_VARIANT[application.status]} className="shrink-0 text-[11px]">
              {STATUS_LABEL[application.status]}
            </Badge>
          )}
          <span className="truncate text-[11px] font-medium text-text-muted">
            {sourceLabel(job.source)}
            {job.job_type ? ` · ${job.job_type}` : ""}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            disabled={isSaving}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Unsave ${title}` : `Save ${title}`}
            title={isSaved ? "Remove from saved" : "Save this role"}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
              "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
              "disabled:cursor-default disabled:opacity-60",
              isSaved
                ? "border-accent bg-accent-light text-accent"
                : "border-border bg-surface text-text-secondary hover:border-border-muted hover:text-text-primary",
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} aria-hidden="true" />
            {isSaving ? "…" : isSaved ? "Saved" : "Save"}
          </button>

          {job.external_apply_url && (
            <a
              href={job.external_apply_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-text-muted hover:text-text-primary"
              title="Apply on external job board"
            >
              Apply
              <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
