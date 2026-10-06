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
};

/**
 * The responsive 2–3 column job grid. Shows a skeleton on first load and an
 * empty state (with a filter reset) when nothing matches.
 */
export function JobGrid({ jobs, selectedId, onSelect, onClearFilters }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-ink bg-surface px-6 py-14 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
          <SearchX className="h-6 w-6 text-text-muted" />
        </div>
        <p className="mt-5 text-sm font-semibold text-text-primary">
          No roles match your filters
        </p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
          Widen the AI threshold or clear the quick filters to see more jobs.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
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