"use client";

import { Button } from "@/components/ui/button";
import type { DashboardFilters } from "@/lib/dashboard-filters";
import { cn } from "@/lib/utils";

type Props = {
  count: number;
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
};

type QuickPill = "all" | "remote" | "fulltime" | "150k";

const PILLS: { key: QuickPill; label: string }[] = [
  { key: "all", label: "All" },
  { key: "remote", label: "Remote" },
  { key: "fulltime", label: "Full Time" },
  { key: "150k", label: "$150k+" },
];

/**
 * "Available Positions" bar. The pills bind to the same filter state as the
 * left sidebar — clicking again clears that pill back to "All".
 */
export function ResultsBar({ count, filters, onChange }: Props) {
  function isActive(pill: QuickPill): boolean {
    switch (pill) {
      case "all":
        return filters.jobType === "all" && filters.salaryFloor === 0;
      case "remote":
        return filters.jobType === "remote";
      case "fulltime":
        return filters.jobType === "fulltime";
      case "150k":
        return filters.salaryFloor === 150;
    }
  }

  function handlePill(pill: QuickPill) {
    if (!isActive(pill)) {
      switch (pill) {
        case "all":
          onChange({ jobType: "all", salaryFloor: 0 });
          break;
        case "remote":
          onChange({ jobType: "remote" });
          break;
        case "fulltime":
          onChange({ jobType: "fulltime" });
          break;
        case "150k":
          onChange({ salaryFloor: 150 });
          break;
      }
      return;
    }

    // Toggling an active pill back off resets the dimension it controls.
    if (pill === "remote" || pill === "fulltime") onChange({ jobType: "all" });
    if (pill === "150k") onChange({ salaryFloor: 0 });
    if (pill === "all") onChange({ jobType: "all", salaryFloor: 0 });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-text-darkest">
        Available Positions{" "}
        <span className="font-normal text-text-secondary">({count})</span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {PILLS.map((pill) => {
          const active = isActive(pill.key);
          return (
            <Button
              key={pill.key}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className={cn("rounded-full px-3.5")}
              onClick={() => handlePill(pill.key)}
            >
              {pill.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}