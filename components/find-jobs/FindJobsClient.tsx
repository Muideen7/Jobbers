"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MapPin, Search, Sparkles, X } from "lucide-react";

import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { JobGrid } from "@/components/dashboard/JobGrid";
import { ResultsBar, type SortOrder } from "@/components/dashboard/ResultsBar";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { Button } from "@/components/ui/button";
import { SourceCredits } from "@/components/shared/SourceCredits";
import {
  DEFAULT_DASHBOARD_FILTERS,
  filterDashboardJobs,
  type DashboardFilters,
} from "@/lib/dashboard-filters";
import { resolveSourceCredits } from "@/lib/source-attribution";
import type { Job } from "@/types";

const PAGE_SIZE = 20;

type Props = {
  initialJobs: Job[];
  initialTotalCount: number;
  initialQuery?: string;
};

type ViewMode = "split" | "grid";

export function FindJobsClient({
  initialJobs,
  initialTotalCount,
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Discovery Hero Search Inputs
  const [searchTitle, setSearchTitle] = useState(initialQuery);
  const [searchLocation, setSearchLocation] = useState("");

  // Filtering state
  const [filters, setFilters] = useState<DashboardFilters>({
    ...DEFAULT_DASHBOARD_FILTERS,
    query: initialQuery,
  });

  // Feed pagination — 20 roles per page, shared by the list and grid layouts.
  const [page, setPage] = useState(1);

  // Feed ordering — quick pills switch between newest / oldest first.
  const [sort, setSort] = useState<SortOrder>("newest");

  // View mode switcher: "grid" (default) vs "split" (single-column list).
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Mobile / tablet filter drawer
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Compute active filters
  const filteredJobs = useMemo(
    () => filterDashboardJobs(jobs, filters),
    [jobs, filters],
  );

  // Order the filtered feed by the quick-pill sort before paginating.
  const sortedJobs = useMemo(() => {
    const copy = [...filteredJobs];
    copy.sort((a, b) => {
      const at = new Date(a.found_at ?? "").getTime() || 0;
      const bt = new Date(b.found_at ?? "").getTime() || 0;
      return sort === "newest" ? bt - at : at - bt;
    });
    return copy;
  }, [filteredJobs, sort]);

  // Paginate the sorted feed. `page` is clamped so a shrinking result set
  // never strands the user on an empty page.
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedJobs = sortedJobs.slice(pageStart, pageStart + PAGE_SIZE);

  // Any filter change starts the feed from the top.
  function applyFilters(patch: Partial<DashboardFilters>) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  // Live multi-source scraping via agent
  async function handleLiveDiscovery(e: React.FormEvent) {
    e.preventDefault();
    const title = searchTitle.trim();
    if (!title || isSearching) return;

    setIsSearching(true);
    setSearchMessage(null);

    try {
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: title,
          location: searchLocation.trim(),
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { jobs: Job[]; successMessage: string };
        error?: string;
      };

      if (!res.ok || !json.success) {
        setSearchMessage(json.error ?? "Failed to find roles. Please try again.");
        return;
      }

      if (json.data) {
        setSearchMessage(json.data.successMessage);
        // Refresh jobs from API to get all scored roles
        const refreshRes = await fetch("/api/jobs?limit=100&sortOption=score");
        const refreshJson = (await refreshRes.json()) as {
          success: boolean;
          data?: { jobs: Job[]; totalCount: number };
        };
        if (refreshJson.success && refreshJson.data) {
          setJobs(refreshJson.data.jobs);
          setTotalCount(refreshJson.data.totalCount);
          setPage(1);
        }
      }
    } catch {
      setSearchMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  }

  // A role click routes to its dedicated detail page (research + apply live there).
  function handleSelectJob(jobId: string) {
    router.push(`/jobs/${jobId}`);
  }

  function handleClearFilters() {
    setPage(1);
    setFilters((prev) => ({ ...DEFAULT_DASHBOARD_FILTERS, query: prev.query }));
  }

  // Attribution credits
  const credits = useMemo(
    () => resolveSourceCredits(jobs.map((job) => job.source)),
    [jobs],
  );

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

  return (
    <div className="flex flex-col gap-6">
      {/* Live Discovery Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-lavender/40 via-surface to-peach-soft/30 p-5 sm:p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-5 items-center gap-1 rounded-full bg-accent-muted px-2 text-[11px] font-semibold text-accent">
                <Sparkles className="h-3 w-3" />
                Live Job Discovery
              </span>
            </div>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              Search Open Roles Scored by AI
            </h1>
            <p className="mt-0.5 text-xs text-text-secondary sm:text-sm">
              Index and match positions across JSearch, Adzuna, RemoteOK, Remotive, and Arbeitnow.
            </p>
          </div>

          {/* Search Inputs Form */}
          <form
            onSubmit={handleLiveDiscovery}
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Role or skill (e.g. React Engineer)"
                aria-label="Job title or skill"
                className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Location (e.g. Remote, Lagos, US)"
                aria-label="Job location"
                className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSearching || !searchTitle.trim()}
              className="rounded-full px-4 text-xs font-semibold shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isSearching ? "Searching…" : "Search live"}
            </Button>
          </form>
        </div>

        {searchMessage && (
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-border/80 bg-surface/90 px-3.5 py-2 text-xs text-text-primary shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span className="truncate">{searchMessage}</span>
          </div>
        )}
      </section>

      {/* Main Workspace Layout — two columns at xl (filter | feed). The role
          detail now lives on its own page, so there is no third preview column. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[264px_minmax(0,1fr)] items-start">
        {/* Left Filter Sidebar (Desktop xl: visible) */}
        <div className="hidden xl:block">
          <FilterSidebar
            filters={filters}
            onChange={applyFilters}
            hideResumeCard={true}
          />
        </div>

        {/* Center feed / job table column */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Results Bar with active filters, quick toggles, and view switcher */}
          <ResultsBar
            count={sortedJobs.length}
            filters={filters}
            onChange={applyFilters}
            sort={sort}
            onSortChange={(next) => {
              setPage(1);
              setSort(next);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onToggleMobileFilters={() => setMobileFiltersOpen(true)}
            mobileFilterCount={activeFilterCount}
          />

          {/* Feed Content — single-column list for Split, cards for Grid */}
          {viewMode === "split" ? (
            <div className="flex min-w-0 flex-col gap-3.5">
              <JobGrid
                jobs={pagedJobs}
                selectedId={null}
                onSelect={handleSelectJob}
                onClearFilters={handleClearFilters}
                layout="single"
              />
            </div>
          ) : (
            <div className="min-w-0">
              <JobGrid
                jobs={pagedJobs}
                selectedId={null}
                onSelect={handleSelectJob}
                onClearFilters={handleClearFilters}
                layout="grid"
              />
            </div>
          )}

          {/* Feed Pagination — 20 roles per page in both layouts */}
          <JobsPagination
            currentPage={currentPage}
            totalCount={filteredJobs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />

          {/* Sources Attribution */}
          {totalCount > 0 && <SourceCredits credits={credits} />}
        </div>
      </div>

      {/* Mobile / Tablet Filter Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-ink/40 backdrop-blur-xs xl:hidden animate-in fade-in duration-200">
          <div className="flex w-full max-w-xs flex-col bg-surface p-5 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-text-primary">Search Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-secondary hover:text-text-primary cursor-pointer"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <FilterSidebar
                filters={filters}
                onChange={applyFilters}
                hideResumeCard={true}
              />
            </div>
            <Button
              type="button"
              className="mt-6 w-full rounded-full"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {filteredJobs.length} Results
            </Button>
          </div>
          <div
            className="flex-1"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}