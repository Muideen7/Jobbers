import { NextRequest, NextResponse } from "next/server";

import { searchAll } from "@/lib/jobs/search-all";
import { detectCountry } from "@/lib/jobs/country";
import {
  isPublicFilter,
  matchesPublicFilter,
  sortPublicJobs,
  toPublicJob,
  type PublicFilter,
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
  };
  error?: string;
};

const RESULTS_PER_PAGE = 12;
// Enough mixed-source results to fill several pages of cards before trimming.
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
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const rawQuery = searchParams.get("q")?.trim() ?? "";
  const query = rawQuery.slice(0, MAX_QUERY_LENGTH);
  const rawFilter = searchParams.get("filter") ?? "all";
  const filter: PublicFilter = isPublicFilter(rawFilter) ? rawFilter : "all";

  const cacheKey = `${filter}:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json<PublicJobsResponse>({ success: true, data: cached.payload });
  }

  try {
    const searchResult = await searchAll(
      {
        title: query || "developer",
        location: "",
        // B1: the landing search has no location input, so detection gets no
        // candidates and yields the "us" default — same single source of
        // truth as the signed-in find route (lib/jobs/country.ts).
        country: detectCountry(),
        remoteOnly: filter === "remote",
      },
      { maxResults: MAX_RESULTS },
    );

    const matched = sortPublicJobs(
      searchResult.jobs.filter((job) => matchesPublicFilter(job, filter)),
      filter,
    );
    const rendered = matched.slice(0, RESULTS_PER_PAGE);

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
        data: { jobs: [], totalCount: 0, query, filter, sources: [] },
      },
      { status: 502 },
    );
  }
}
