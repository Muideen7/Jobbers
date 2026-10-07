"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  FlaskConical,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  SearchX,
  X,
} from "lucide-react";

import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { JobGrid } from "@/components/dashboard/JobGrid";
import { ResultsBar, type SortOrder } from "@/components/dashboard/ResultsBar";
import { JobTabs } from "@/components/find-jobs/JobTabs";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { SourceCredits } from "@/components/shared/SourceCredits";
import {
  DEFAULT_DASHBOARD_FILTERS,
  filterDashboardJobs,
  type DashboardFilters,
} from "@/lib/dashboard-filters";
import { resolveSourceCredits } from "@/lib/source-attribution";
import type { JobsTab } from "@/lib/workspace/jobs-tab";
import { NEW_MATCH_SCORE_THRESHOLD } from "@/lib/workspace/constants";
import type { ApplicationRef, Job } from "@/types";

const PAGE_SIZE = 20;

/**
 * Session-scoped guard for the `last_jobs_visit_at` write (STEP 3). Keyed on
 * sessionStorage so tab switches within /jobs — or a back/forward within the
 * same tab — do not keep pushing the sidebar's "new" window forward.
 */
const JOBS_VISIT_KEY = "jobbers:jobs-visit-recorded";

type Props = {
  /** Server-scoped feed for the active `?tab=` / `?researched=` view. */
  jobs: Job[];
  initialQuery?: string;
  tab: JobsTab;
  researched: boolean;
  /** Application rows for this user, keyed by job id. */
  applications: Record<string, ApplicationRef>;
  /** Drives the For You empty state: are target roles on the profile yet? */
  hasTargetRoles: boolean;
};

type ViewMode = "split" | "grid";

function readVisitFlag(): boolean {
  try {
    return window.sessionStorage.getItem(JOBS_VISIT_KEY) === "1";
  } catch {
    return false; // private mode: fall back to once per mount
  }
}

function writeVisitFlag() {
  try {
    window.sessionStorage.setItem(JOBS_VISIT_KEY, "1");
  } catch {
    /* private mode — the write simply does not stick */
  }
}

function FeedEmpty({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
        {icon}
      </div>
      <p className="mt-5 text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

/**
 * The merged /jobs surface: For You, All and Saved in one list, plus the
 * `?researched=1` filter that used to be the Dossiers wall.
 *
 * Tab and research state live in the URL and are resolved server-side, so the
 * feed can never disagree with a deep link. Filters, sort, view mode and
 * pagination stay client-side over whatever the server scoped.
 */
export function FindJobsClient({
  jobs,
  initialQuery = "",
  tab,
  researched,
  applications,
  hasTargetRoles,
}: Props) {
  const router = useRouter();
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

  // Optimistic save/unsave. `null` means "we just removed it and the server
  // has not confirmed yet"; an entry here always wins over `applications`.
  const [overrides, setOverrides] = useState<Record<string, ApplicationRef | null>>({});
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingUnsave, setPendingUnsave] = useState<{
    job: Job;
    application: ApplicationRef;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  function applicationFor(jobId: string): ApplicationRef | null {
    if (Object.prototype.hasOwnProperty.call(overrides, jobId)) {
      return overrides[jobId] ?? null;
    }
    return applications[jobId] ?? null;
  }

  function markSaving(jobId: string, saving: boolean) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      return next;
    });
  }

  /**
   * STEP 3 — read the sidebar summary first, then close the "new matches"
   * window. Reading before writing is what keeps the badge (and any per-card
   * marker) visible for this visit: once `last_jobs_visit_at` moves, jobs found
   * earlier stop counting as new.
   */
  const visitInFlight = useRef(false);
  useEffect(() => {
    if (visitInFlight.current || readVisitFlag()) return;
    visitInFlight.current = true;

    fetch("/api/sidebar-summary", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("summary"))))
      .then(() => fetch("/api/sidebar-summary/visit", { method: "POST" }))
      .then((res) => {
        if (!res.ok) throw new Error("visit");
        writeVisitFlag();
      })
      .catch(() => {
        visitInFlight.current = false; // let the next mount retry
      });
  }, []);

  // Compute active filters
  const filteredJobs = useMemo(
    () => filterDashboardJobs(jobs, filters),
    [jobs, filters],
  );

  // For You arrives already ranked by match score; every other tab honours the
  // newest/oldest pills.
  const orderedJobs = useMemo(() => {
    if (tab === "for-you") return filteredJobs;
    const copy = [...filteredJobs];
    copy.sort((a, b) => {
      const at = new Date(a.found_at ?? "").getTime() || 0;
      const bt = new Date(b.found_at ?? "").getTime() || 0;
      return sort === "newest" ? bt - at : at - bt;
    });
    return copy;
  }, [filteredJobs, sort, tab]);

  // Paginate the ordered feed. `page` is clamped so a shrinking result set
  // never strands the user on an empty page.
  const totalPages = Math.max(1, Math.ceil(orderedJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedJobs = orderedJobs.slice(pageStart, pageStart + PAGE_SIZE);

  // Card state: the optimistic overrides folded back into a lookup record.
  const cardApplications = useMemo(() => {
    const resolved: Record<string, ApplicationRef> = {};
    for (const job of jobs) {
      const ref = Object.prototype.hasOwnProperty.call(overrides, job.id)
        ? overrides[job.id]
        : (applications[job.id] ?? null);
      if (ref) resolved[job.id] = ref;
    }
    return resolved;
  }, [jobs, overrides, applications]);

  // Any filter change starts the feed from the top.
  function applyFilters(patch: Partial<DashboardFilters>) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleClearFilters() {
    setPage(1);
    setFilters((prev) => ({ ...DEFAULT_DASHBOARD_FILTERS, query: prev.query }));
  }

  // Live multi-source scraping via agent. The server component owns the feed,
  // so a successful run just revalidates it rather than patching local state.
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
        setPage(1);
        startTransition(() => router.refresh());
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

  async function saveJob(job: Job) {
    const previous = applicationFor(job.id);
    markSaving(job.id, true);
    setOverrides((prev) => ({ ...prev, [job.id]: { id: "", status: "saved" } }));

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, status: "saved" }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { application: ApplicationRef };
        error?: string;
      };
      const created = json.data?.application;
      if (!res.ok || !json.success || !created) {
        throw new Error(json.error ?? "save failed");
      }
      setOverrides((prev) => ({ ...prev, [job.id]: created }));
    } catch {
      setOverrides((prev) => ({ ...prev, [job.id]: previous }));
      setToast("Couldn't save this role. Please try again.");
    } finally {
      markSaving(job.id, false);
    }
  }

  async function unsaveJob(job: Job, application: ApplicationRef) {
    markSaving(job.id, true);
    setOverrides((prev) => ({ ...prev, [job.id]: null }));

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setOverrides((prev) => ({ ...prev, [job.id]: application }));
      setToast("Couldn't remove this role from Saved. Please try again.");
    } finally {
      markSaving(job.id, false);
    }
  }

  function handleToggleSave(job: Job) {
    const current = applicationFor(job.id);
    if (!current) {
      void saveJob(job);
      return;
    }
    // Anything past "saved" has history worth confirming before it is dropped.
    if (current.status !== "saved") {
      setPendingUnsave({ job, application: current });
      return;
    }
    void unsaveJob(job, current);
  }

  function confirmUnsave() {
    if (pendingUnsave) void unsaveJob(pendingUnsave.job, pendingUnsave.application);
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

  const resultsHeading = researched
    ? "Researched roles"
    : tab === "for-you"
      ? "Top matches"
      : tab === "saved"
        ? "Saved roles"
        : "Available Roles";

  // Only shown when the tab itself came back empty — an empty *filtered* feed
  // keeps JobGrid's "clear your filters" state instead.
  const tabEmptyState: ReactNode =
    jobs.length === 0 ? (
      researched ? (
        <FeedEmpty
          icon={<FlaskConical className="h-6 w-6 text-text-muted" />}
          title="No researched roles yet"
          body="Researching happens from a job's Company tab — open a role and run the research there, then it appears under this filter."
          action={
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/jobs?tab=all">Browse all jobs</Link>
            </Button>
          }
        />
      ) : tab === "saved" ? (
        <FeedEmpty
          icon={<Bookmark className="h-6 w-6 text-text-muted" />}
          title="Nothing saved yet"
          body="Bookmark a role from the All tab and it lands here with its application status."
          action={
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/jobs?tab=all">Browse all jobs</Link>
            </Button>
          }
        />
      ) : !hasTargetRoles ? (
        <FeedEmpty
          icon={<Sparkles className="h-6 w-6 text-text-muted" />}
          title="No recommendations yet"
          body="Tell Jobbers which roles you are after and every listing gets scored against your profile."
          action={
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/profile?tab=preferences">Set target roles</Link>
            </Button>
          }
        />
      ) : (
        <FeedEmpty
          icon={<SearchX className="h-6 w-6 text-text-muted" />}
          title="No strong matches yet"
          body={`No role is scoring ${NEW_MATCH_SCORE_THRESHOLD}% or higher against your profile right now. Widen your target roles to cast a bigger net.`}
          action={
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/profile?tab=preferences">Adjust target roles</Link>
            </Button>
          }
        />
      )
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header: title, live search, then the tab bar */}
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
              Jobs
            </h1>
            <p className="mt-0.5 text-xs text-text-secondary sm:text-sm">
              Search, filter and save roles scored against your Jobbers profile.
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

      <JobTabs activeTab={tab} researched={researched} />

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
            count={orderedJobs.length}
            filters={filters}
            onChange={applyFilters}
            sort={sort}
            onSortChange={(next) => {
              setPage(1);
              setSort(next);
            }}
            heading={resultsHeading}
            showSort={tab !== "for-you"}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onToggleMobileFilters={() => setMobileFiltersOpen(true)}
            mobileFilterCount={activeFilterCount}
          />

          {/* Feed Content — single-column list for Split, cards for Grid.
              Both layouts render the one JobCard, so there is no second list. */}
          <div className="min-w-0">
            <JobGrid
              jobs={pagedJobs}
              selectedId={null}
              onSelect={handleSelectJob}
              onClearFilters={handleClearFilters}
              layout={viewMode === "split" ? "single" : "grid"}
              applications={cardApplications}
              savingIds={savingIds}
              onToggleSave={handleToggleSave}
              emptyState={tabEmptyState}
            />
          </div>

          {/* Feed Pagination — 20 roles per page in both layouts */}
          <JobsPagination
            currentPage={currentPage}
            totalCount={orderedJobs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />

          {/* Sources Attribution */}
          {credits.length > 0 && <SourceCredits credits={credits} />}
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

      <ConfirmDialog
        open={pendingUnsave !== null}
        onOpenChange={(open) => {
          if (!open) setPendingUnsave(null);
        }}
        title="Remove this tracked application?"
        description="This drops the role out of your pipeline along with its status history and follow-ups. Saving it again afterwards starts a fresh record."
        confirmLabel="Remove application"
        cancelLabel="Keep it"
        tone="destructive"
        onConfirm={confirmUnsave}
      />

      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}
