/**
 * Live smoke test for the keyless providers (A4/A5) and the searchAll
 * orchestrator (A6). Not part of `npm test` (that only globs *.test.ts) —
 * run it manually:
 *
 *   node tests/job-sources-smoke.ts
 *
 * No API keys required. These four feeds are public and keyless by design.
 */

import { arbeitnowProvider, searchArbeitnow } from "../lib/jobs/arbeitnow.ts";
import { jobicyProvider, remoteokProvider, remotiveProvider } from "../lib/jobs/remote-feeds.ts";
import { searchAll } from "../lib/jobs/search-all.ts";
import type { JobProvider, JobSearchQuery } from "../lib/jobs/types.ts";

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

  if (failures > 0) {
    console.error(`\n${failures} case(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll cases passed.");
}

await main();
