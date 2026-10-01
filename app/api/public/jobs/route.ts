import { NextRequest, NextResponse } from "next/server";

import { searchJobs, cleanCompanyName, type AdzunaJob } from "@/lib/adzuna";
import type { PublicJob } from "@/types";

export type PublicJobsResponse = {
  success: boolean;
  data: { jobs: PublicJob[]; totalCount: number; query: string; filter: string };
  error?: string;
};

const RESULTS_PER_PAGE = 12;
// Adzuna repeats a single multi-location requisition once per site, so a 12-result page
// can collapse to as few as 3 distinct jobs. Over-fetch, then trim after dedupe.
const ADZUNA_FETCH_MULTIPLIER = 4;
const MAX_ADZUNA_FETCH = 50;
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_QUERY_LENGTH = 80;
const VALID_FILTERS = new Set(["all", "remote", "fulltime", "salary150"]);

const cache = new Map<string, { expires: number; payload: PublicJobsResponse["data"] }>();

function formatSalary(job: AdzunaJob): string {
  const { salary_min: min, salary_max: max } = job;

  if (min == null && max == null) {
    return "Salary not listed";
  }

  const short = (value: number) =>
    value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;

  // Adzuna returns a single machine-predicted figure as min === max, which rendered as
  // "$184k – $184k". Collapse that to one value.
  if (min != null && max != null && min === max) {
    return short(min);
  }

  if (min != null && max != null) {
    return `${short(min)} – ${short(max)}`;
  }

  return `${short((min ?? max) as number)}+`;
}

function formatContractType(job: AdzunaJob): string {
  if (job.contract_type) {
    return job.contract_type
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return "Full time";
}

function toPublicJob(job: AdzunaJob): PublicJob {
  return {
    id: job.id,
    title: job.title,
    company: cleanCompanyName(job.company?.display_name ?? "") || "Unknown company",
    location: job.location?.display_name ?? "Remote",
    salary: formatSalary(job),
    contractType: formatContractType(job),
    category: job.category?.label ?? "Technology",
    created: job.created,
    url: job.redirect_url,
    description: job.description ?? "",
  };
}

/**
 * Public, unauthenticated job search used by the landing page.
 *
 * This is intentionally separate from `/api/jobs`, which is auth-gated and scoped to
 * the signed-in user's saved matches. Results are cached in-memory for five minutes
 * so that an unauthenticated visitor cannot burn through the Adzuna quota on every
 * keystroke.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const rawQuery = searchParams.get("q")?.trim() ?? "";
  const query = rawQuery.slice(0, MAX_QUERY_LENGTH);
  const rawFilter = searchParams.get("filter") ?? "all";
  const filter = VALID_FILTERS.has(rawFilter) ? rawFilter : "all";

  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    return NextResponse.json<PublicJobsResponse>(
      {
        success: false,
        error: "Job search is not configured yet.",
        data: { jobs: [], totalCount: 0, query, filter },
      },
      { status: 503 },
    );
  }

  const cacheKey = `${filter}:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json<PublicJobsResponse>({ success: true, data: cached.payload });
  }

  try {
    // Adzuna's `what` is a keyword match, so the filter labels ride along in the
    // same field rather than needing a second request.
    const keywords = [query, filter === "remote" ? "remote" : ""].filter(Boolean).join(" ");

    const jobs = await searchJobs(keywords || "developer", "", "us", {
      resultsPerPage: Math.min(
        RESULTS_PER_PAGE * ADZUNA_FETCH_MULTIPLIER,
        MAX_ADZUNA_FETCH,
      ),
      ...(filter === "fulltime" ? { contractType: "full_time" as const } : {}),
      ...(filter === "salary150" ? { salaryMin: 150000, sortBy: "salary" as const } : {}),
    });

    const payload = {
      jobs: jobs.slice(0, RESULTS_PER_PAGE).map(toPublicJob),
      totalCount: jobs.length,
      query,
      filter,
    };

    cache.set(cacheKey, { expires: Date.now() + QUERY_CACHE_TTL_MS, payload });

    return NextResponse.json<PublicJobsResponse>({ success: true, data: payload });
  } catch (error) {
    console.error("[api/public/jobs]", error);
    return NextResponse.json<PublicJobsResponse>(
      {
        success: false,
        error: "Job search is temporarily unavailable. Please try again.",
        data: { jobs: [], totalCount: 0, query, filter },
      },
      { status: 502 },
    );
  }
}
