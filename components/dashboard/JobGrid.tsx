"use client";

import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

import { JobCard } from "@/components/dashboard/JobCard";
import { Button } from "@/components/ui/button";
import type { ApplicationRef, Job } from "@/types";

type Props = {
  jobs: Job[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearFilters: () => void;
  layout?: "single" | "grid";
  /** Application row per job id, used for the card's status chip. */
  applications: Record<string, ApplicationRef>;
  /** Job ids whose save/unsave request is still in flight. */
  savingIds: ReadonlySet<string>;
  onToggleSave: (job: Job) => void;
  /**
   * Replaces the built-in "no roles match your filters" copy when the feed is
   * empty because the tab itself has nothing in it — the fix then is a
   * different tab, not a looser filter.
   */
  emptyState?: ReactNode;
};

/**
 * Responsive job feed supporting single-column list (Split View)
 * or multi-column responsive grid (Grid View). Both layouts render the same
 * JobCard, so /jobs has exactly one list component.
 */
export function JobGrid({
  jobs,
  selectedId,
  onSelect,
  onClearFilters,
  layout = "grid",
  applications,
  savingIds,
  onToggleSave,
  emptyState,
}: Props) {
  if (jobs.length === 0) {
    if (emptyState) return <>{emptyState}</>;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
          <SearchX className="h-6 w-6 text-text-muted" />
        </div>
        <p className="mt-5 text-sm font-semibold text-text-primary">
          No roles match your filters
        </p>
        <p className="mt-2 max-w-xs text-xs text-text-muted">
          Widen the AI threshold or clear the location/salary filters to see more roles.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5 rounded-full"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div
      className={
        layout === "single"
          ? "flex flex-col gap-3.5 xl:max-w-[75%]"
          : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      }
    >
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isSelected={job.id === selectedId}
          onSelect={onSelect}
          application={applications[job.id] ?? null}
          isSaving={savingIds.has(job.id)}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
