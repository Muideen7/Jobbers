"use client";

import { SearchX } from "lucide-react";

import { JobCard } from "@/components/dashboard/JobCard";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types";

type Props = {
  jobs: Job[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearFilters: () => void;
  layout?: "single" | "grid";
};

/**
 * Responsive job feed supporting single-column list (Split View)
 * or multi-column responsive grid (Grid View).
 */
export function JobGrid({
  jobs,
  selectedId,
  onSelect,
  onClearFilters,
  layout = "grid",
}: Props) {
  if (jobs.length === 0) {
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
        />
      ))}
    </div>
  );
}