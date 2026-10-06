"use client";

import { RotateCcw } from "lucide-react";

import { ResumeDropzone } from "@/components/dashboard/ResumeDropzone";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type {
  DashboardFilters,
  JobTypeFilter,
  SalaryFloor,
} from "@/lib/dashboard-filters";
import { cn } from "@/lib/utils";

type Props = {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onAppliedResume?: () => void;
};

const SALARY_OPTIONS: { label: string; floor: SalaryFloor }[] = [
  { label: "Any", floor: 0 },
  { label: "$100k+", floor: 100 },
  { label: "$150k+", floor: 150 },
];

const JOB_TYPE_OPTIONS: { label: string; value: JobTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Full-Time", value: "fulltime" },
  { label: "Remote", value: "remote" },
  { label: "Contract", value: "contract" },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
      {children}
    </h2>
  );
}

/**
 * Left column of the dashboard workspace: resume drop-in, AI match threshold
 * slider, and the shared filter state (also bound by the results-bar pills).
 */
export function FilterSidebar({ filters, onChange, onAppliedResume }: Props) {
  return (
    <aside className="flex flex-col gap-5 xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:self-start">
      <section className="rounded-2xl border border-ink bg-surface p-5 shadow-sm">
        <SectionTitle>Your Resume</SectionTitle>
        <p className="mt-1.5 text-sm leading-5 text-text-muted">
          Drop a PDF and Gemini fills your profile from it.
        </p>
        <div className="mt-3">
          <ResumeDropzone {...(onAppliedResume ? { onApplied: onAppliedResume } : {})} />
        </div>
      </section>

      <section className="rounded-2xl border border-ink bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle>AI Match Threshold</SectionTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={() => onChange({ minScore: 0 })}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        <p className="mt-1.5 text-sm leading-5 text-text-muted">
          Only show roles that Gemini scores at least this high.
        </p>
        <div className="mt-4">
          <Slider
            value={[filters.minScore]}
            min={0}
            max={100}
            step={5}
            onValueChange={([value]) => onChange({ minScore: value ?? 0 })}
            aria-label="Minimum AI match score"
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-text-primary">
          Min match: {filters.minScore}%
        </p>
      </section>

      <section className="rounded-2xl border border-ink bg-surface p-5 shadow-sm">
        <SectionTitle>Location</SectionTitle>
        <input
          value={filters.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="e.g. Remote or New York"
          aria-label="Filter by location"
          className="mt-3 w-full rounded-lg border border-ink bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        />
      </section>

      <section className="rounded-2xl border border-ink bg-surface p-5 shadow-sm">
        <SectionTitle>Salary</SectionTitle>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SALARY_OPTIONS.map((option) => (
            <Button
              key={option.floor}
              type="button"
              size="sm"
              variant={filters.salaryFloor === option.floor ? "default" : "outline"}
              className={cn("justify-center rounded-full px-2")}
              onClick={() => onChange({ salaryFloor: option.floor })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink bg-surface p-5 shadow-sm">
        <SectionTitle>Job Type</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {JOB_TYPE_OPTIONS.map((option) => {
            const active = filters.jobType === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="rounded-full px-3"
                onClick={() =>
                  onChange({
                    jobType: active ? "all" : option.value,
                  })
                }
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}