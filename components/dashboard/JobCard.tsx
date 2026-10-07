import Link from "next/link";
import { ArrowUpRight, DollarSign, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Job } from "@/types";
import { cn, formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";

type Props = {
  job: Job;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function InfoChip({ icon, children }: { icon: "map" | "pay"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary/80 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
      {icon === "map" ? <MapPin className="h-3 w-3 shrink-0" /> : <DollarSign className="h-3 w-3 shrink-0" />}
      <span className="truncate max-w-[140px]">{children}</span>
    </span>
  );
}

/**
 * Clean, scannable job card in the dashboard feed.
 * Clicking anywhere previews the role in the right detail panel.
 */
export function JobCard({ job, isSelected, onSelect }: Props) {
  const company = job.company ?? "Unknown company";
  const title = job.title ?? "Untitled role";
  const hasResearch = job.company_research !== null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(job.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job.id);
        }
      }}
      aria-label={`Select ${title} at ${company}`}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer shadow-card",
        isSelected
          ? "border-accent bg-accent-muted/15 ring-2 ring-accent/20"
          : "border-border bg-surface hover:border-border-muted hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-secondary border border-border/60 text-xs font-bold text-text-primary">
              {getInitials(company)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold leading-4 text-text-secondary">
                {company}
              </p>
              <p className="text-[11px] text-text-muted">{formatDate(job.found_at)}</p>
            </div>
          </div>

          <Badge variant={getMatchBadgeVariant(job.match_score)} className="shrink-0 text-[11px]">
            {job.match_score !== null ? `${job.match_score}% Match` : "Not scored"}
          </Badge>
        </div>

        {/* Role Title */}
        <h3 className="mt-2.5 text-sm sm:text-base font-semibold leading-snug text-text-primary group-hover:text-accent transition-colors line-clamp-1">
          {title}
        </h3>

        {/* Location & Salary Chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {job.location && <InfoChip icon="map">{job.location}</InfoChip>}
          {job.salary && <InfoChip icon="pay">{job.salary}</InfoChip>}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          {hasResearch ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-info-medium">
              <Sparkles className="h-3 w-3" />
              Researched
            </span>
          ) : (
            <span className="text-[11px] capitalize text-text-muted">
              {job.job_type ?? "Full-time"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {job.external_apply_url && (
            <Link
              href={job.external_apply_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-text-muted hover:text-text-primary"
              title="Apply on external job board"
            >
              Apply
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
          <span
            className={cn(
              "text-[11px] font-medium transition-colors",
              isSelected ? "text-accent" : "text-text-muted group-hover:text-text-secondary",
            )}
          >
            {isSelected ? "Active" : "Preview →"}
          </span>
        </div>
      </div>
    </div>
  );
}