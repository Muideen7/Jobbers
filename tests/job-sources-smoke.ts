/**
 * Live smoke test for the keyless providers (A4/A5), the searchAll
 * orchestrator (A6), the public-jobs rewire (A7) and country detection with
 * graceful Adzuna degradation (B1/B2). Not part of `npm test`
 * (that only globs *.test.ts) — run it manually:
 *
 *   node --env-file=.env.local tests/job-sources-smoke.ts
 *
 * The four feeds are public and keyless; --env-file lets Adzuna/JSearch join
 * when their keys are present (missing keys must degrade, not fail the run).
 */

import { arbeitnowProvider, searchArbeitnow } from "../lib/jobs/arbeitnow.ts";
import { jobicyProvider, remoteokProvider, remotiveProvider } from "../lib/jobs/remote-feeds.ts";
import { detectCountry } from "../lib/jobs/country.ts";
import { searchAll } from "../lib/jobs/search-all.ts";
import { sourceWarningLogRows } from "../lib/jobs/source-warnings.ts";
import type { JobProvider, JobSearchQuery } from "../lib/jobs/types.ts";
import {
  matchesPublicFilter,
  PUBLIC_RESULTS_PER_PAGE,
  sortPublicJobs,
  toPublicJob,
} from "../lib/public-jobs.ts";
import { resolveSourceCredits } from "../lib/source-attribution.ts";

const query: JobSearchQuery = {
  title: "frontend developer",
  location: "Lagos",
  country: "ng",
};

let failures = 0;

function report(label: string, ok: boolean, detail: string): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${detail}`);
  if (!ok) {
    failures += 1;
  }
}

async function main(): Promise<void> {
  // A4 — Arbeitnow: ≥50 jobs, HTTP apply URLs.
  try {
    const jobs = await searchArbeitnow(query);
    const withUrl = jobs.filter((job) => job.applyUrl.startsWith("http")).length;
    report(
      "arbeitnow",
      jobs.length >= 50 && withUrl === jobs.length,
      `${jobs.length} jobs, ${withUrl} with HTTP apply URLs`,
    );
  } catch (error) {
    report("arbeitnow", false, error instanceof Error ? error.message : String(error));
  }

  // A5 — each remote feed returns at least one normalized job.
  const feeds: Array<[string, JobProvider]> = [
    ["remoteok", remoteokProvider],
    ["remotive", remotiveProvider],
    ["jobicy", jobicyProvider],
  ];

  for (const [label, provider] of feeds) {
    try {
      const jobs = await provider.search(query);
      report(label, jobs.length >= 1, `${jobs.length} jobs`);
    } catch (error) {
      report(label, false, error instanceof Error ? error.message : String(error));
    }
  }

  // A6 — orchestrator: fresh state so no daily caps interfere; every result
  // must come from a client-mode feed and therefore carry a matching title.
  try {
    const result = await searchAll(query, {
      providers: [arbeitnowProvider, remoteokProvider, remotiveProvider, jobicyProvider],
    });
    const errored = result.outcomes.filter((outcome) => outcome.error);
    const tokens = ["frontend", "developer"];
    const relevantTitles = result.jobs.filter((job) => {
      const title = job.title.toLowerCase();
      return tokens.some((token) => title.includes(token));
    }).length;

    report(
      "searchAll",
      result.jobs.length >= 1 && relevantTitles === result.jobs.length,
      `${result.jobs.length} merged jobs (${relevantTitles} title-matched), ` +
        `${errored.length} source errors: ${errored.map((o) => o.source).join(",") || "none"}`,
    );
    for (const outcome of result.outcomes) {
      console.log(`       - ${outcome.source}: ${outcome.count} jobs${outcome.error ? ` (${outcome.error})` : ""}`);
    }
  } catch (error) {
    report("searchAll", false, error instanceof Error ? error.message : String(error));
  }

  // A7 — public-jobs pipeline on the *default* registry (JSearch leads,
  // Adzuna demoted to last): the "Remote" chip's full path —
  // remoteOnly query → post-filter → PublicJob mapping → attribution.
  try {
    const result = await searchAll(
      { title: "developer", location: "", country: "us", remoteOnly: true },
      { maxResults: 48 },
    );
    const matched = sortPublicJobs(
      result.jobs.filter((job) => matchesPublicFilter(job, "remote")),
      "remote",
    );
    const rendered = matched.slice(0, PUBLIC_RESULTS_PER_PAGE);
    const mapped = rendered.map(toPublicJob);
    const credits = resolveSourceCredits(rendered.map((job) => job.source));
    const uniqueIds = new Set(mapped.map((job) => job.id));

    report(
      "publicJobs remote chip",
      mapped.length >= 1 &&
        uniqueIds.size === mapped.length &&
        credits.length >= 1,
      `${mapped.length} cards, ${credits.length} credited sources: ` +
        credits.map((credit) => credit.label).join(", "),
    );
    for (const outcome of result.outcomes) {
      console.log(
        `       - ${outcome.source}: ${outcome.count} jobs${outcome.error ? ` (${outcome.error})` : ""}`,
      );
    }
  } catch (error) {
    report("publicJobs remote chip", false, error instanceof Error ? error.message : String(error));
  }

  // B1/B2 — country detection + graceful Adzuna degradation on the full
  // registry. For "ng" Adzuna must be *skipped* (count 0, no error — its API
  // 404s there), every other source must still deliver, and the failure rows
  // must never blame Adzuna for a silent skip.
  try {
    const country = detectCountry("Lagos");
    report("detectCountry", country === "ng", `"Lagos" → ${country}`);

    const result = await searchAll(
      { title: "frontend developer", location: "Lagos", country },
      { maxResults: 48 },
    );
    const adzunaOutcome = result.outcomes.find((outcome) => outcome.source === "adzuna");
    const warningRows = sourceWarningLogRows({
      runId: null,
      userId: "smoke",
      outcomes: result.outcomes,
    });

    report(
      "B1 adzuna skip (ng)",
      adzunaOutcome !== undefined &&
        adzunaOutcome.count === 0 &&
        adzunaOutcome.error === undefined,
      `adzuna: ${adzunaOutcome ? `${adzunaOutcome.count} jobs${adzunaOutcome.error ? ` (${adzunaOutcome.error})` : " (skipped cleanly)"}` : "missing"}`,
    );
    report(
      "B2 other sources survive",
      result.jobs.length >= 1 && !warningRows.some((row) => row.message.includes("adzuna")),
      `${result.jobs.length} jobs despite Adzuna skip, ` +
        `${warningRows.length} warning row(s): ${warningRows.map((row) => row.message).join(" | ") || "none"}`,
    );
    for (const outcome of result.outcomes) {
      console.log(
        `       - ${outcome.source}: ${outcome.count} jobs${outcome.error ? ` (${outcome.error})` : ""}`,
      );
    }
  } catch (error) {
    report("B1/B2 country degradation", false, error instanceof Error ? error.message : String(error));
  }

  if (failures > 0) {
    console.error(`\n${failures} case(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll cases passed.");
}

await main();
