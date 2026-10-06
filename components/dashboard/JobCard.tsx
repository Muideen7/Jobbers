import Link from "next/link";
import { ArrowUpRight, DollarSign, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/types";
import { cn, formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";

type Props = {
  job: Job;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function InfoChip({ icon, children }: { icon: "map" | "pay"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
      {icon === "map" ? <MapPin className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
      {children}
    </span>
  );
}

/**
 * One result in the dashboard feed. Clicking the body populates the right-hand
 * detail panel; the footer links go to the full detail page / external source.
 */
export function JobCard({ job, isSelected, onSelect }: Props) {
  const company = job.company ?? "Unknown company";
  const title = job.title ?? "Untitled role";

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-2xl border-ink py-0 shadow-sm transition-all",
        isSelected
          ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
          : "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <CardContent className="flex flex-col gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => onSelect(job.id)}
          aria-label={`Preview ${title} at ${company}`}
          className="w-full cursor-pointer text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-xs font-bold text-accent">
                {getInitials(company)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-4 text-text-primary">
                  {company}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{formatDate(job.found_at)}</p>
              </div>
            </div>
            <Badge variant={getMatchBadgeVariant(job.match_score)}>
              {job.match_score !== null ? `${job.match_score}% Match` : "Not scored"}
            </Badge>
          </div>

          <h3 className="mt-3 text-base font-semibold leading-6 text-text-primary">
            {title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.location && <InfoChip icon="map">{job.location}</InfoChip>}
            {job.salary && <InfoChip icon="pay">{job.salary}</InfoChip>}
          </div>
        </button>

        <div className="flex items-center gap-2 border-t border-ink/10 pt-3">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/find-jobs/${job.id}`}>View details</Link>
          </Button>
          {job.external_apply_url && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={job.external_apply_url} target="_blank" rel="noreferrer">
                Apply
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}