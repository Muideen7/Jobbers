"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Sparkles } from "lucide-react";

import { CompanyLogo } from "@/components/homepage/Logos";
import { SourceCredits } from "@/components/shared/SourceCredits";
import { resolveSourceCredits } from "@/lib/source-attribution";
import type { PublicJob } from "@/types";

const filters = [
  { id: "all", label: "All roles" },
  { id: "remote", label: "Remote" },
  { id: "fulltime", label: "Full time" },
  { id: "salary150", label: "$150k+" },
] as const;

type FilterId = (typeof filters)[number]["id"];

type Status = "idle" | "loading" | "done" | "error";

const PASTEL_BACKGROUNDS = [
  "bg-pastel-blue",
  "bg-pastel-mint",
  "bg-pastel-pink",
  "bg-pastel-lilac",
  "bg-pastel-cream",
  "bg-pastel-aqua",
];

function backgroundFor(index: number) {
  return PASTEL_BACKGROUNDS[index % PASTEL_BACKGROUNDS.length];
}

function initialsFor(company: string) {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function isKnownCompany(company: string) {
  return company.toLowerCase() in {
    google: true,
    microsoft: true,
    amazon: true,
    meta: true,
    apple: true,
    netflix: true,
    stripe: true,
    openai: true,
  };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatPosted(iso: string) {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return "Recently";
  }

  const days = Math.max(0, Math.round((Date.now() - then) / 86_400_000));

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function LiveOpportunities() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [liveJobs, setLiveJobs] = useState<PublicJob[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sources, setSources] = useState<string[]>([]);

  const requestId = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Deliberately does not touch state synchronously, so it is safe to call from an effect.
  const fetchJobs = useCallback(async (search: string, filter: FilterId) => {
    const id = ++requestId.current;

    try {
      const response = await fetch(
        `/api/public/jobs?q=${encodeURIComponent(search)}&filter=${filter}`,
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: { jobs: PublicJob[]; totalCount: number; sources?: string[] };
        error?: string;
      };

      // Ignore responses that arrive after a newer request has been issued.
      if (id !== requestId.current) {
        return;
      }

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error ?? "Search is unavailable right now.");
        setStatus("error");
        return;
      }

      setLiveJobs(payload.data.jobs);
      setTotalCount(payload.data.totalCount);
      setSources(payload.data.sources ?? []);
      setError(null);
      setStatus("done");
    } catch {
      if (id !== requestId.current) {
        return;
      }

      setError("Search is unavailable right now.");
      setStatus("error");
    }
  }, []);

  // Seed real results on mount so the section is never purely static. Deferred to a
  // microtask so the request is not started from inside the effect body itself.
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void fetchJobs("", "all");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchJobs]);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setStatus("loading");
      void fetchJobs(value, activeFilter);
    }, 350);
  }

  function handleFilterChange(filter: FilterId) {
    setActiveFilter(filter);
    clearTimeout(debounce.current);
    setStatus("loading");
    void fetchJobs(query, filter);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(debounce.current);
    setStatus("loading");
    void fetchJobs(query, activeFilter);
  }

  useEffect(() => () => clearTimeout(debounce.current), []);

  const isLoading = status === "loading";

  // The API reports which sources contributed the rendered cards; credit them
  // with link-backs as their terms require (plan A7).
  const credits = useMemo(() => resolveSourceCredits(sources), [sources]);

  return (
    <section id="live-opportunities" className="w-full py-16 sm:py-24 relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-text-darkest">
            <Sparkles className="w-3.5 h-3.5 text-text-strong fill-current" />
            <span>Live opportunities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
            Roles that fit, not roles that exist.
          </h2>

          <p className="text-text-strong text-sm sm:text-base leading-relaxed">
            Search roles in real time. Add a profile and Jobbers scores every one of them
            against your skills, so you can judge a match in a second.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-[28px] border border-border/80 bg-surface p-4 sm:p-5 shadow-xs"
        >
          <div className="flex flex-col lg:flex-row items-center gap-3">
            <label htmlFor="landing-job-search" className="sr-only">
              Search jobs by title, skill or company
            </label>
            <div className="flex-1 w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/80 bg-surface-tertiary/60 focus-within:border-text-muted focus-within:bg-surface transition-colors">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                id="landing-job-search"
                type="search"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Search by title, skill or company"
                maxLength={80}
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => {
                const isActive = activeFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => handleFilterChange(filter.id)}
                    aria-pressed={isActive}
                    className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-ink text-accent-foreground"
                        : "bg-surface text-text-dark border border-border/80 hover:border-text-muted"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-secondary min-h-5">
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Searching live roles…</span>
            </>
          ) : status === "error" ? (
            <span className="text-rose-strong">{error}</span>
          ) : status === "done" ? (
            <span>
              {totalCount} live {totalCount === 1 ? "role" : "roles"} found
              {query ? ` for “${query}”` : ""}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {liveJobs.map((job, index) => (
            <article
              key={job.id}
              className={`${backgroundFor(index)} rounded-[28px] p-6 sm:p-7 flex flex-col justify-between border border-ink/[0.04] min-h-[300px] sm:min-h-[320px] transition-all duration-200`}
            >
              <div>
                <div className="flex items-center justify-between text-xs sm:text-[13px] text-text-secondary font-medium pb-4 sm:pb-5">
                  <span className="truncate pr-2">{job.location}</span>
                  <span className="px-2 py-0.5 rounded-[8px] bg-surface/70 text-text-darkest font-bold shrink-0">
                    {formatPosted(job.created)}
                  </span>
                </div>

                <h3 className="text-xl sm:text-[22px] font-bold text-text-primary tracking-tight leading-[1.22]">
                  {job.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-text-secondary mt-3.5 sm:mt-4">
                  {job.salary} · {job.contractType}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3.5 sm:mt-4">
                  <span className="px-2.5 py-1 rounded-[8px] text-[11px] sm:text-[12px] font-medium bg-surface/70 text-text-dark">
                    {job.category}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-text-strong leading-relaxed mt-4 line-clamp-4">
                  {stripHtml(job.description)}
                </p>
              </div>

              <div className="mt-8 pt-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isKnownCompany(job.company) ? (
                    <CompanyLogo type={job.company} className="w-5 h-5 shrink-0" />
                  ) : (
                    <span
                      className="grid h-5 w-5 shrink-0 place-items-center rounded bg-surface/80 text-[9px] font-bold text-text-dark"
                      aria-hidden="true"
                    >
                      {initialsFor(job.company)}
                    </span>
                  )}
                  <span className="text-xs sm:text-[13px] font-bold text-text-primary tracking-tight truncate">
                    {job.company}
                  </span>
                </div>

                {/* Scoring and full detail need a profile, so the result is gated behind auth. */}
                <Link
                  href="/login"
                  className="btn btn-primary btn-sm cursor-pointer shrink-0"
                  aria-label={`Sign in to view ${job.title} at ${job.company}`}
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && status === "done" && liveJobs.length === 0 ? (
          <p className="mt-10 text-center text-sm text-text-secondary">
            No live roles matched that search. Try a broader keyword or a different filter.
          </p>
        ) : null}

        {!isLoading && status === "done" && liveJobs.length > 0 ? (
          <div className="mt-8">
            <SourceCredits credits={credits} />
          </div>
        ) : null}

        <div className="mt-12 text-center">
          <Link href="/find-jobs" className="btn btn-secondary cursor-pointer">
            Browse all matched roles
          </Link>
        </div>
      </div>
    </section>
  );
}
