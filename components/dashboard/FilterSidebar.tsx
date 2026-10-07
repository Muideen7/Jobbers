"use client";

import { MapPin, RotateCcw, SlidersHorizontal, X } from "lucide-react";

import { ResumeDropzone } from "@/components/dashboard/ResumeDropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  DashboardFilters,
  JobTypeFilter,
  LevelFilter,
  PostedWithinFilter,
  SalaryFloor,
} from "@/lib/dashboard-filters";
import { cn } from "@/lib/utils";

type Props = {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onAppliedResume?: () => void;
  hideResumeCard?: boolean;
};

const JOB_TYPE_OPTIONS: { label: string; value: JobTypeFilter }[] = [
  { label: "Full-time", value: "fulltime" },
  { label: "Part-time", value: "parttime" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
  { label: "Freelance", value: "freelance" },
];

const LEVEL_OPTIONS: { label: string; value: LevelFilter }[] = [
  { label: "Intern", value: "intern" },
  { label: "Junior", value: "junior" },
  { label: "Mid-level", value: "mid" },
  { label: "Senior", value: "senior" },
  { label: "Staff", value: "staff" },
  { label: "Principal", value: "principal" },
  { label: "Lead", value: "lead" },
  { label: "Manager", value: "manager" },
  { label: "Director+", value: "director" },
  { label: "Executive", value: "executive" },
];

const POSTED_OPTIONS: { label: string; value: PostedWithinFilter }[] = [
  { label: "Any time", value: "any" },
  { label: "24 hours", value: "24h" },
  { label: "3 days", value: "3d" },
  { label: "This week", value: "week" },
];

const SALARY_OPTIONS: { label: string; floor: SalaryFloor }[] = [
  { label: "Any", floor: 0 },
  { label: "$60k+", floor: 60 },
  { label: "$100k+", floor: 100 },
  { label: "$150k+", floor: 150 },
  { label: "$200k+", floor: 200 },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
      {children}
    </h3>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
        active
          ? "bg-ink text-accent-foreground shadow-xs"
          : "bg-surface-secondary/60 text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
      )}
    >
      {children}
    </button>
  );
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Clean left column for the discovery workspace: Workplace, Location,
 * Availability, Job type, Level, Posted within and Salary floor — every control
 * bound to `DashboardFilters`, so the feed filters live. The optional resume
 * dropzone sits above the filters.
 */
export function FilterSidebar({ filters, onChange, onAppliedResume, hideResumeCard = false }: Props) {
  const activeFilterCount =
    (filters.remoteOnly ? 1 : 0) +
    (filters.aiFocus ? 1 : 0) +
    (filters.location.trim().length > 0 ? 1 : 0) +
    (filters.recentlyClosed ? 1 : 0) +
    filters.jobTypes.length +
    filters.levels.length +
    (filters.postedWithin !== "any" ? 1 : 0) +
    (filters.salaryFloor > 0 ? 1 : 0) +
    (filters.minScore > 0 ? 1 : 0);

  function handleResetAll() {
    onChange({
      remoteOnly: false,
      aiFocus: false,
      location: "",
      recentlyClosed: false,
      jobTypes: [],
      levels: [],
      postedWithin: "any",
      salaryFloor: 0,
      minScore: 0,
    });
  }

  return (
    <aside className="flex flex-col gap-4">
      {/* Resume Card (optional) */}
      {!hideResumeCard && (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="mb-2.5 flex items-center justify-between">
            <SectionLabel>Resume</SectionLabel>
            <span className="text-[11px] font-medium text-text-muted">AI Autofill</span>
          </div>
          <ResumeDropzone {...(onAppliedResume ? { onApplied: onAppliedResume } : {})} />
        </section>
      )}

      {/* Unified Filters Card */}
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card">
        {/* Filters Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-text-secondary hover:text-text-primary"
              onClick={handleResetAll}
            >
              <RotateCcw className="h-3 w-3" />
              Reset all
            </Button>
          )}
        </div>

        {/* Workplace */}
        <div className="pt-4">
          <SectionLabel>Workplace</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill
              active={filters.remoteOnly}
              onClick={() => onChange({ remoteOnly: !filters.remoteOnly })}
            >
              Remote only
            </Pill>
            <Pill
              active={filters.aiFocus}
              onClick={() => onChange({ aiFocus: !filters.aiFocus })}
            >
              AI / ML roles
            </Pill>
          </div>
        </div>

        {/* Location */}
        <FilterSection label="Location">
          <div className="relative mt-2">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={filters.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="City, state, or country…"
              aria-label="Filter by location"
              className="w-full rounded-xl border border-border bg-surface-secondary/40 py-2 pl-9 pr-8 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {filters.location && (
              <button
                type="button"
                onClick={() => onChange({ location: "" })}
                aria-label="Clear location filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection label="Availability">
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill
              active={filters.recentlyClosed}
              onClick={() => onChange({ recentlyClosed: !filters.recentlyClosed })}
            >
              Recently closed
            </Pill>
          </div>
        </FilterSection>

        {/* Job type */}
        <FilterSection label="Job type">
          <div className="mt-2 flex flex-wrap gap-1.5">
            {JOB_TYPE_OPTIONS.map((option) => {
              const active = filters.jobTypes.includes(option.value);
              return (
                <Pill
                  key={option.value}
                  active={active}
                  onClick={() => onChange({ jobTypes: toggleIn(filters.jobTypes, option.value) })}
                >
                  {option.label}
                </Pill>
              );
            })}
          </div>
        </FilterSection>

        {/* Level */}
        <FilterSection label="Level">
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LEVEL_OPTIONS.map((option) => {
              const active = filters.levels.includes(option.value);
              return (
                <Pill
                  key={option.value}
                  active={active}
                  onClick={() => onChange({ levels: toggleIn(filters.levels, option.value) })}
                >
                  {option.label}
                </Pill>
              );
            })}
          </div>
        </FilterSection>

        {/* Posted within */}
        <FilterSection label="Posted within">
          <div className="mt-2 flex flex-wrap gap-1.5">
            {POSTED_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                active={filters.postedWithin === option.value}
                onClick={() => onChange({ postedWithin: option.value })}
              >
                {option.label}
              </Pill>
            ))}
          </div>
        </FilterSection>

        {/* Salary floor */}
        <FilterSection label="Salary floor">
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SALARY_OPTIONS.map((option) => (
              <Pill
                key={option.floor}
                active={filters.salaryFloor === option.floor}
                onClick={() => onChange({ salaryFloor: option.floor })}
              >
                {option.label}
              </Pill>
            ))}
          </div>
        </FilterSection>
      </section>
    </aside>
  );
}