"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FeedHero } from "@/components/dashboard/FeedHero";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { JobDetailPanel } from "@/components/dashboard/JobDetailPanel";
import { JobGrid } from "@/components/dashboard/JobGrid";
import { ResultsBar } from "@/components/dashboard/ResultsBar";
import {
  DEFAULT_DASHBOARD_FILTERS,
  filterDashboardJobs,
  type DashboardFilters,
} from "@/lib/dashboard-filters";
import type { Job } from "@/types";

type Props = {
  initialJobs: Job[];
  initialQuery?: string;
};

/**
 * Stateful core of the 3-column dashboard workspace. Holds the jobs, the one
 * shared filter state (left sidebar + results bar pills both bind to it), and
 * the selection that feeds the right-hand detail panel.
 */
export function DashboardClient({ initialJobs, initialQuery = "" }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [prevInitialJobs, setPrevInitialJobs] = useState<Job[]>(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    ...DEFAULT_DASHBOARD_FILTERS,
    query: initialQuery,
  }));
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Adjust state during render (sanctioned React pattern) instead of syncing in
  // effects: server props change identity after router.refresh() (research
  // completed) or a ?q= navigation, and that is the moment to adopt them.
  if (prevInitialJobs !== initialJobs) {
    setPrevInitialJobs(initialJobs);
    setJobs(initialJobs);
  }
  if (prevInitialQuery !== initialQuery) {
    setPrevInitialQuery(initialQuery);
    setFilters((current) =>
      current.query === initialQuery ? current : { ...current, query: initialQuery },
    );
  }

  const filtered = useMemo(
    () => filterDashboardJobs(jobs, filters),
    [jobs, filters],
  );

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? null,
    [jobs, selectedId],
  );

  // Auto-select the top result so the panel is never empty on first load.
  // Guards a one-shot render adjustment: once selectedId is set it stops.
  if (selectedId === null && filtered.length > 0) {
    setSelectedId(filtered[0]?.id ?? null);
  }

  const handleFiltersChange = useCallback((patch: Partial<DashboardFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters((current) => ({ ...DEFAULT_DASHBOARD_FILTERS, query: current.query }));
  }, []);

  const refetchJobs = useCallback(async () => {
    const res = await fetch("/api/jobs?limit=100");
    const json = (await res.json()) as {
      success: boolean;
      data?: { jobs: Job[] };
    };
    if (json.success && json.data) {
      setJobs(json.data.jobs);
    }
  }, []);

  async function handleLiveSearch(query: string) {
    setIsSearching(true);
    setSearchMessage(null);
    try {
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: query, location: "" }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { successMessage: string };
        error?: string;
      };
      if (!res.ok || !json.success) {
        setSearchMessage(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSearchMessage(json.data?.successMessage ?? "Search complete.");
      await refetchJobs();
    } catch {
      setSearchMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleAppliedResume() {
    // Profile data changed server-side — refresh the attention banner and jobs.
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[264px_minmax(0,1fr)_380px]">
      <FilterSidebar
        filters={filters}
        onChange={handleFiltersChange}
        onAppliedResume={handleAppliedResume}
      />

      <div className="flex min-w-0 flex-col gap-5">
        <FeedHero
          isSearching={isSearching}
          message={searchMessage}
          onSearch={handleLiveSearch}
        />
        <ResultsBar count={filtered.length} filters={filters} onChange={handleFiltersChange} />
        <JobGrid
          jobs={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClearFilters={handleClearFilters}
        />
      </div>

      <JobDetailPanel job={selectedJob} />
    </div>
  );
}