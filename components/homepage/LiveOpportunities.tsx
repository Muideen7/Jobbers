"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Search, Sparkles } from "lucide-react";

import { CompanyLogo } from "@/components/homepage/Logos";
import { SourceCredits } from "@/components/shared/SourceCredits";
import { resolveSourceCredits } from "@/lib/source-attribution";
import type { PublicJob } from "@/types";

type Status = "idle" | "loading" | "done" | "error";

/** The five dropdown pills in spec order — each narrows the server-side search. */
type FacetId = "category" | "country" | "salary" | "skills" | "employment";

type Filters = Record<FacetId, string>;

const EMPTY_FILTERS: Filters = {
  category: "",
  country: "",
  salary: "any",
  employment: "any",
  skills: "",
};

type Option = { value: string; label: string };

/** Markets the Countries dropdown scopes the search to — "" means any country. */
const COUNTRY_CHOICES = [
  "United States",
  "United Kingdom",
  "Nigeria",
  "Canada",
  "India",
  "Germany",
  "Netherlands",
  "Australia",
  "Singapore",
  "South Africa",
] as const;

const SALARY_OPTIONS: Option[] = [
  { value: "any", label: "Any salary" },
  { value: "50k", label: "$50k and up" },
  { value: "100k", label: "$100k and up" },
  { value: "150k", label: "$150k and up" },
];

const EMPLOYMENT_OPTIONS: Option[] = [
  { value: "any", label: "Any type" },
  { value: "fulltime", label: "Full time" },
  { value: "parttime", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const SKILL_CHOICES = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "SQL",
  "Docker",
  "Figma",
] as const;

/** Pill order follows the design spec; `label` is the pill's resting text. */
const FACET_PILLS: ReadonlyArray<{ id: FacetId; label: string }> = [
  { id: "category", label: "Job Categories" },
  { id: "country", label: "Countries" },
  { id: "salary", label: "Salary Range" },
  { id: "skills", label: "Skills" },
  { id: "employment", label: "Employment Type" },
];

/** px — matches the w-56 menu below, used to flip alignment at the viewport edge. */
const FACET_MENU_WIDTH = 224;

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

/**
 * One dropdown pill: chevron button + listbox menu. The resting label is the
 * spec text ("Job Categories", "Countries", …); once a value is picked the
 * pill turns dark and shows `label: value`, and the menu marks the selection
 * with a check.
 */
function FilterPill({
  label,
  options,
  value,
  isOpen,
  menuAlign,
  onToggle,
  onSelect,
}: {
  label: string;
  options: Option[];
  value: string;
  isOpen: boolean;
  menuAlign: "left" | "right";
  onToggle: (trigger: HTMLElement) => void;
  onSelect: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  const isActive = value !== "" && value !== "any";
  const text = isActive ? `${label}: ${selected?.label ?? value}` : label;

  return (
    <div className="relative" data-filter-pill>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={(event) => onToggle(event.currentTarget)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors duration-200 ${
          isActive || isOpen
            ? "bg-ink text-accent-foreground border-transparent hover:border-transparent"
            : "bg-surface text-text-dark border-border/80 hover:border-text-muted"
        }`}
      >
        <span className="max-w-[9.5rem] truncate">{text}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          aria-label={label}
          className={`absolute top-full z-30 mt-2 max-h-64 w-56 overflow-auto rounded-xl border border-border bg-surface p-1.5 shadow-card ${
            menuAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => (
            // li is presentation-only here (role="none") so the option buttons
            // are the listbox's children in the accessibility tree.
            <li key={option.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => onSelect(option.value)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  option.value === value
                    ? "bg-surface-secondary font-semibold text-text-primary"
                    : "text-text-dark hover:bg-surface-secondary"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function LiveOpportunities() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFacet, setOpenFacet] = useState<FacetId | null>(null);
  const [menuAlign, setMenuAlign] = useState<"left" | "right">("left");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [liveJobs, setLiveJobs] = useState<PublicJob[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  // Categories reported by the API — the Job Categories dropdown options.
  const [categoryList, setCategoryList] = useState<string[]>([]);

  const requestId = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // fetchJobs must keep a stable identity (it seeds once on mount), so the
  // active filters travel through a ref instead of the dependency list.
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Deliberately does not touch state synchronously, so it is safe to call from an effect.
  const fetchJobs = useCallback(
    async (search: string, active: Filters = filtersRef.current) => {
      const id = ++requestId.current;

      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (active.category) params.set("category", active.category);
        if (active.country) params.set("country", active.country);
        if (active.salary !== "any") params.set("salary", active.salary);
        if (active.skills) params.set("skills", active.skills);
        if (active.employment !== "any") params.set("employment", active.employment);

        const response = await fetch(`/api/public/jobs?${params.toString()}`);
        const payload = (await response.json()) as {
          success: boolean;
          data?: {
            jobs: PublicJob[];
            totalCount: number;
            sources?: string[];
            facets?: { categories?: string[] };
          };
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
        setCategoryList(payload.data.facets?.categories ?? []);
        setError(null);
        setStatus("done");
      } catch {
        if (id !== requestId.current) {
          return;
        }

        setError("Search is unavailable right now.");
        setStatus("error");
      }
    },
    [],
  );

  // Seed real results on mount so the section is never purely static. Deferred to a
  // microtask so the request is not started from inside the effect body itself.
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void fetchJobs("");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchJobs]);

  // Close an open dropdown on outside click or Escape.
  useEffect(() => {
    if (!openFacet) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest("[data-filter-pill]")) {
        setOpenFacet(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenFacet(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openFacet]);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setStatus("loading");
      // Reads the freshest filters through the ref at fire time.
      void fetchJobs(value);
    }, 350);
  }

  function handleFacetChange(id: FacetId, value: string) {
    const next: Filters = { ...filters, [id]: value };
    setFilters(next);
    setOpenFacet(null);
    clearTimeout(debounce.current);
    setStatus("loading");
    void fetchJobs(query, next);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setOpenFacet(null);
    clearTimeout(debounce.current);
    setStatus("loading");
    void fetchJobs(query, EMPTY_FILTERS);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(debounce.current);
    setStatus("loading");
    void fetchJobs(query, filters);
  }

  function toggleFacet(id: FacetId, trigger: HTMLElement) {
    if (openFacet === id) {
      setOpenFacet(null);
      return;
    }

    // Open away from the viewport edge so the menu never overflows horizontally.
    setMenuAlign(
      trigger.getBoundingClientRect().left + FACET_MENU_WIDTH >
        window.innerWidth - 8
        ? "right"
        : "left",
    );
    setOpenFacet(id);
  }

  useEffect(() => () => clearTimeout(debounce.current), []);

  const isLoading = status === "loading";

  // The API reports which sources contributed the rendered cards; credit them
  // with link-backs as their terms require (plan A7).
  const credits = useMemo(() => resolveSourceCredits(sources), [sources]);

  const categoryOptions = useMemo<Option[]>(
    () => [
      { value: "", label: "Any category" },
      ...categoryList.map((category) => ({ value: category, label: category })),
    ],
    [categoryList],
  );
  const countryOptions = useMemo<Option[]>(
    () => [
      { value: "", label: "Any country" },
      ...COUNTRY_CHOICES.map((country) => ({ value: country, label: country })),
    ],
    [],
  );
  const skillOptions = useMemo<Option[]>(
    () => [
      { value: "", label: "Any skill" },
      ...SKILL_CHOICES.map((skill) => ({ value: skill, label: skill })),
    ],
    [],
  );

  const optionsById: Record<FacetId, Option[]> = {
    category: categoryOptions,
    country: countryOptions,
    salary: SALARY_OPTIONS,
    skills: skillOptions,
    employment: EMPLOYMENT_OPTIONS,
  };

  const hasActiveFilters =
    filters.category !== "" ||
    filters.country !== "" ||
    filters.skills !== "" ||
    filters.salary !== "any" ||
    filters.employment !== "any";

  return (
    <section id="live-opportunities" className="w-full py-16 sm:py-24 relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-text-darkest">
            <Sparkles className="w-3.5 h-3.5 text-text-strong fill-current" />
            <span>Live Opportunities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
            Find your next opportunity.
          </h2>

          <p className="text-text-strong text-sm sm:text-base leading-relaxed">
            Browse thousands of roles matched to your profile – updated every 60
            seconds from top companies worldwide.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-[28px] border border-border/80 bg-surface p-4 sm:p-5 shadow-xs"
        >
          <label htmlFor="landing-job-search" className="sr-only">
            Search jobs by title, skill or company
          </label>
          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/80 bg-surface-tertiary/60 focus-within:border-text-muted focus-within:bg-surface transition-colors">
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

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {FACET_PILLS.map((pill) => (
              <FilterPill
                key={pill.id}
                label={pill.label}
                options={optionsById[pill.id]}
                value={filters[pill.id]}
                isOpen={openFacet === pill.id}
                menuAlign={menuAlign}
                onToggle={(trigger) => toggleFacet(pill.id, trigger)}
                onSelect={(value) => handleFacetChange(pill.id, value)}
              />
            ))}

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="btn btn-primary btn-sm ml-auto cursor-pointer disabled:opacity-40"
            >
              Clear Filter
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 className="text-sm sm:text-base font-bold text-text-primary">
            Available Positions{" "}
            <span className="font-normal text-text-secondary">
              (Search Result: {totalCount.toLocaleString()})
            </span>
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary min-h-5">
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching live roles…</span>
              </>
            ) : status === "error" ? (
              <span className="text-rose-strong">{error}</span>
            ) : null}
          </div>
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
