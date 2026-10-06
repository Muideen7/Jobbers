"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobFilters, type MatchFilter, type SortOption } from "@/components/find-jobs/JobFilters";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { SourceCredits } from "@/components/shared/SourceCredits";
import { resolveSourceCredits } from "@/lib/source-attribution";
import type { Job } from "@/types";

const PAGE_SIZE = 20;

type Props = {
  initialJobs: Job[];
  initialTotalCount: number;
};

export function FindJobsClient({ initialJobs, initialTotalCount }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("score");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchJobs = useCallback(
    async (
      search: string,
      match: MatchFilter,
      sort: SortOption,
      page: number,
    ) => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams({
          search,
          matchFilter: match,
          sortOption: sort,
          page: String(page),
        });
        const res = await fetch(`/api/jobs?${params.toString()}`);
        const json = (await res.json()) as {
          success: boolean;
          data?: { jobs: Job[]; totalCount: number; page: number };
          error?: string;
        };
        if (json.success && json.data) {
          setJobs(json.data.jobs);
          setTotalCount(json.data.totalCount);
        }
      } catch {
        // silently keep existing results on network error
      } finally {
        setIsFetching(false);
      }
    },
    [],
  );

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchJobs(filterSearch, matchFilter, sortOption, currentPage);
    });
  }, [filterSearch, matchFilter, sortOption, currentPage, fetchJobs]);

  async function handleSearch(jobTitle: string, location: string) {
    setIsSearching(true);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { jobs: Job[]; successMessage: string };
        error?: string;
      };
      if (!res.ok || !json.success) {
        setSuccessMessage(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (json.data) {
        setSuccessMessage(json.data.successMessage);
        setCurrentPage(1);
        await fetchJobs(filterSearch, matchFilter, sortOption, 1);
      }
    } catch {
      setSuccessMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleFilterChange<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  // Attribution credits derive from the jobs actually on screen, so every page
  // and every reload credits the right sources (plan A7).
  const credits = useMemo(
    () => resolveSourceCredits(jobs.map((job) => job.source)),
    [jobs],
  );

  return (
    <div className="flex flex-col gap-6">
      <SearchControls
        onSearch={handleSearch}
        isSearching={isSearching}
        successMessage={successMessage}
      />

      <div className="flex flex-col gap-4">
        <JobFilters
          search={filterSearch}
          onSearchChange={handleFilterChange(setFilterSearch)}
          matchFilter={matchFilter}
          onMatchFilterChange={handleFilterChange(setMatchFilter)}
          sortOption={sortOption}
          onSortOptionChange={handleFilterChange(setSortOption)}
        />

        <JobsTable jobs={jobs} isLoading={isFetching} />

        <JobsPagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />

        {totalCount > 0 && <SourceCredits credits={credits} />}
      </div>
    </div>
  );
}
