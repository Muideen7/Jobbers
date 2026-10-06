import { NextRequest, NextResponse } from "next/server";

import { searchAll } from "@/lib/jobs/search-all";
import { countryFromText, detectCountry } from "@/lib/jobs/country";
import {
  categoryFacets,
  isPublicEmploymentType,
  isPublicFilter,
  isPublicSalaryBand,
  matchesPublicCategory,
  matchesPublicCountry,
  matchesPublicEmployment,
  matchesPublicFilter,
  matchesPublicSalary,
  matchesPublicSkills,
  PUBLIC_RESULTS_PER_PAGE,
  sanitizePublicCategory,
  sanitizePublicSkills,
  sortPublicJobs,
  toPublicJob,
  type PublicEmploymentType,
  type PublicFilter,
  type PublicSalaryBand,
} from "@/lib/public-jobs";
import type { PublicJob } from "@/types";

export type PublicJobsResponse = {
  success: boolean;
  data: {
    jobs: PublicJob[];
    totalCount: number;
    query: string;
    filter: string;
    /** Sources that actually contributed the jobs shown — drives the attribution line. */
    sources: string[];
    /** Distinct categories still available under the other active filters — drives the Job Categories dropdown. */
    facets: { categories: string[] };
  };
  error?: string;
};

// Breadth for the facet lists and the full set behind "Browse all matched
// roles"; the grid itself trims to PUBLIC_RESULTS_PER_PAGE after filtering.
const MAX_RESULTS = 48;
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000;
// The security audit flagged this Map as unbounded — evict oldest past the cap.
const MAX_CACHE_ENTRIES = 200;
const MAX_QUERY_LENGTH = 80;

const cache = new Map<string, { expires: number; payload: PublicJobsResponse["data"] }>();

/**
 * Public, unauthenticated job search used by the landing page.
 *
 * This is intentionally separate from `/api/jobs`, which is auth-gated and scoped to
 * the signed-in user's saved matches. Results are cached in-memory for five minutes
 * so that an unauthenticated visitor cannot burn the free-tier quotas on every
 * keystroke.
 *
 * Runs on the multi-source `searchAll` orchestrator (JSearch + Arbeitnow + remote
 * feeds, Adzuna as fallback) — no single provider gates this endpoint anymore;
 * individual failures surface only when *every* source fails.
 *
 * Beyond `q`/`filter`, the five LiveOpportunities dropdowns narrow the same
 * result set server-side (`category`, `country`, `salary`, `skills`,
 * `employment`) so `totalCount` — the "Available Positions" count above the
 * grid — always matches what the cards can show. `data.facets.categories`
 * carries the categories still available under the *other* active filters.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const rawQuery = searchParams.get("q")?.trim() ?? "";
  const query = rawQuery.slice(0, MAX_QUERY_LENGTH);
  const rawFilter = searchParams.get("filter") ?? "all";
  const filter: PublicFilter = isPublicFilter(rawFilter) ? rawFilter : "all";

  // Facet params — allowlisted or sanitised before they reach a filter or a
  // cache key; an unauthenticated param must never flow through raw.
  const rawCountry = searchParams.get("country")?.trim().slice(0, 80) ?? "";
  const countryScope = rawCountry ? countryFromText(rawCountry) : null;
  const countryCode = countryScope ?? detectCountry();
  // Only scope the provider queries for a country we could actually resolve;
  // the post-filter below then keeps sources that ignore it honest.
  const searchLocation = countryScope ? rawCountry : "";
  const category = sanitizePublicCategory(searchParams.get("category"));
  const rawSalary = searchParams.get("salary") ?? "any";
  const salary: PublicSalaryBand = isPublicSalaryBand(rawSalary) ? rawSalary : "any";
  const rawEmployment = searchParams.get("employment") ?? "any";
  const employment: PublicEmploymentType = isPublicEmploymentType(rawEmployment)
    ? rawEmployment
    : "any";
  const skills = sanitizePublicSkills(searchParams.get("skills"));

  const cacheKey = [
    filter,
    countryCode,
    searchLocation.toLowerCase(),
    (category ?? "").toLowerCase(),
    salary,
    employment,
    skills.map((skill) => skill.toLowerCase()).join(","),
    query.toLowerCase(),
  ].join(":");
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json<PublicJobsResponse>({ success: true, data: cached.payload });
  }

  try {
    const searchResult = await searchAll(
      {
        title: query || "developer",
        // The Countries dropdown scopes the search itself (JSearch embeds the
        // location in its query, Adzuna gets its market country); with no
        // selection detection has no candidates and yields the "us" default —
        // same single source of truth as the signed-in find route.
        location: searchLocation,
        country: countryCode,
        remoteOnly: filter === "remote",
      },
      { maxResults: MAX_RESULTS },
    );

    // Everything except the category filter, so the facets can offer categories
    // the other filters haven't already removed — the dropdown never collapses
    // to its own selection.
    const postFiltered = searchResult.jobs.filter(
      (job) =>
        matchesPublicFilter(job, filter) &&
        matchesPublicCountry(job, countryCode) &&
        matchesPublicSalary(job, salary) &&
        matchesPublicEmployment(job, employment) &&
        matchesPublicSkills(job, skills),
    );
    const facets = { categories: categoryFacets(postFiltered) };
    const matched = sortPublicJobs(
      postFiltered.filter((job) => matchesPublicCategory(job, category)),
      filter,
    );
    const rendered = matched.slice(0, PUBLIC_RESULTS_PER_PAGE);

    // Every source failed — a genuine outage, not just an empty result set.
    const allSourcesFailed =
      searchResult.outcomes.length > 0 && searchResult.outcomes.every((o) => o.error);
    if (allSourcesFailed) {
      throw new Error(
        `all sources failed: ${searchResult.outcomes.map((o) => `${o.source}: ${o.error}`).join("; ")}`,
      );
    }

    const payload: PublicJobsResponse["data"] = {
      jobs: rendered.map(toPublicJob),
      totalCount: matched.length,
      query,
      filter,
      // Credit only what is actually rendered (ToS attribution, plan A7).
      sources: [...new Set(rendered.map((job) => job.source))],
      facets,
    };

    cache.set(cacheKey, { expires: Date.now() + QUERY_CACHE_TTL_MS, payload });

    while (cache.size > MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next();
      if (oldest.done) {
        break;
      }
      cache.delete(oldest.value);
    }

    return NextResponse.json<PublicJobsResponse>({ success: true, data: payload });
  } catch (error) {
    console.error("[api/public/jobs]", error);
    return NextResponse.json<PublicJobsResponse>(
      {
        success: false,
        error: "Job search is temporarily unavailable. Please try again.",
        data: {
          jobs: [],
          totalCount: 0,
          query,
          filter,
          sources: [],
          facets: { categories: [] },
        },
      },
      { status: 502 },
    );
  }
}
