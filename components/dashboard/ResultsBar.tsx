"use client";

import { Columns2, LayoutGrid, SlidersHorizontal, X } from "lucide-react";

import { JOB_BOARDS } from "@/lib/job-boards";
import type { DashboardFilters } from "@/lib/dashboard-filters";
import { cn } from "@/lib/utils";

/** Feed ordering driven by the quick pills (replaces the old filter pills). */
export type SortOrder = "newest" | "oldest";

type Props = {
  count: number;
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  /**
   * The For You tab has a fixed ranking (match score descending), so it hides
   * the newest/oldest pills rather than showing controls that do nothing.
   */
  showSort?: boolean;
  /** Replaces "Available Roles" so the count reads correctly on every tab. */
  heading?: string;
  viewMode?: "split" | "grid";
  onViewModeChange?: (mode: "split" | "grid") => void;
  onToggleMobileFilters?: () => void;
  mobileFilterCount?: number;
};

const SORT_PILLS: { key: SortOrder; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

export function ResultsBar({
  count,
  filters,
  onChange,
  sort,
  onSortChange,
  showSort = true,
  heading = "Available Roles",
  viewMode,
  onViewModeChange,
  onToggleMobileFilters,
  mobileFilterCount = 0,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* Mobile Filter Button */}
        {onToggleMobileFilters && (
          <button
            type="button"
            onClick={onToggleMobileFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-primary hover:border-border-muted xl:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-text-secondary" />
            Filters
            {mobileFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground px-1">
                {mobileFilterCount}
              </span>
            )}
          </button>
        )}

        <h2 className="text-sm font-semibold text-text-primary">
          {heading}
        </h2>
        <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-text-secondary">
          {count}
        </span>

        {/* Active Filter Badges */}
        {filters.minScore > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-medium text-accent">
            ≥ {filters.minScore}% Match
            <button
              type="button"
              onClick={() => onChange({ minScore: 0 })}
              className="hover:text-accent-dark cursor-pointer"
              aria-label="Remove match score filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.query && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            &ldquo;{filters.query}&rdquo;
            <button
              type="button"
              onClick={() => onChange({ query: "" })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove search query"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.location && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            {filters.location}
            <button
              type="button"
              onClick={() => onChange({ location: "" })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove location filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.jobBoard && filters.jobBoard !== "all" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            {JOB_BOARDS.find((b) => b.id === filters.jobBoard)?.label ?? filters.jobBoard}
            <button
              type="button"
              onClick={() => onChange({ jobBoard: "all" })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove job board filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.remoteOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            Remote only
            <button
              type="button"
              onClick={() => onChange({ remoteOnly: false })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove remote filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.aiFocus && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-medium text-accent">
            AI / ML
            <button
              type="button"
              onClick={() => onChange({ aiFocus: false })}
              className="hover:text-accent-dark cursor-pointer"
              aria-label="Remove AI focus filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.salaryFloor > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            ≥ ${filters.salaryFloor}k+
            <button
              type="button"
              onClick={() => onChange({ salaryFloor: 0 })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove salary floor filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.postedWithin !== "any" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            {filters.postedWithin === "24h"
              ? "Past 24h"
              : filters.postedWithin === "3d"
                ? "Past 3 days"
                : "This week"}
            <button
              type="button"
              onClick={() => onChange({ postedWithin: "any" })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove posted within filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {filters.jobTypes.map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary"
          >
            {type}
            <button
              type="button"
              onClick={() =>
                onChange({
                  jobTypes: filters.jobTypes.filter((t) => t !== type),
                })
              }
              className="hover:text-text-primary cursor-pointer"
              aria-label={`Remove ${type} filter`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {filters.levels.map((level) => (
          <span
            key={level}
            className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary"
          >
            {level}
            <button
              type="button"
              onClick={() =>
                onChange({
                  levels: filters.levels.filter((l) => l !== level),
                })
              }
              className="hover:text-text-primary cursor-pointer"
              aria-label={`Remove ${level} filter`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {filters.recentlyClosed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            Recently closed
            <button
              type="button"
              onClick={() => onChange({ recentlyClosed: false })}
              className="hover:text-text-primary cursor-pointer"
              aria-label="Remove recently closed filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:self-auto">
        {/* Sort Pills — filtering lives in the sidebar, this only orders the feed */}
        {showSort && (
          <div className="flex flex-wrap items-center gap-1.5">
            {SORT_PILLS.map((pill) => {
              const active = sort === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => onSortChange(pill.key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "bg-ink text-accent-foreground shadow-xs"
                      : "bg-surface border border-border text-text-secondary hover:border-border-muted hover:text-text-primary",
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        )}

        {/* View Mode Switcher (Desktop) */}
        {viewMode && onViewModeChange && (
          <div className="hidden lg:flex items-center rounded-full border border-border bg-surface p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => onViewModeChange("split")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                viewMode === "split"
                  ? "bg-surface-secondary text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              )}
              title="List View"
            >
              <Columns2 className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-surface-secondary text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}