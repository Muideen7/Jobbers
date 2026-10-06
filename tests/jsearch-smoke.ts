/**
 * Live smoke test for the JSearch provider (plan task A3).
 * Not part of `npm test` (that only globs *.test.ts) — run it manually:
 *
 *   node --env-file=.env.local tests/jsearch-smoke.ts
 *
 * Verifies real searches return results with full descriptions for NG, US and
 * GB — the three regions that motivated the multi-source work.
 */

import { searchJsearch } from "../lib/jobs/jsearch.ts";
import type { JobSearchQuery } from "../lib/jobs/types.ts";

const CASES: JobSearchQuery[] = [
  { title: "frontend developer", location: "", country: "us" },
  { title: "frontend developer", location: "Lagos", country: "ng" },
  { title: "frontend developer", location: "London", country: "gb" },
];

async function main(): Promise<void> {
  if (!process.env.JSEARCH_API_KEY?.trim()) {
    console.error(
      "JSEARCH_API_KEY is not set. Get a free key at https://app.openwebninja.com/api/jsearch " +
        "and add it to .env.local, then re-run:\n  node --env-file=.env.local tests/jsearch-smoke.ts",
    );
    process.exit(1);
  }

  let failures = 0;

  for (const testCase of CASES) {
    const label = `${testCase.country}${testCase.location ? `/${testCase.location}` : ""}`;

    try {
      const jobs = await searchJsearch(testCase);
      const withDescription = jobs.filter((job) => job.description.length > 0).length;
      const withApplyUrl = jobs.filter((job) => job.applyUrl.length > 0).length;

      const ok = jobs.length > 0 && withDescription > 0 && withApplyUrl === jobs.length;
      console.log(
        `${ok ? "PASS" : "FAIL"} ${label}: ${jobs.length} jobs, ` +
          `${withDescription} with description, ${withApplyUrl} with apply URL`,
      );
      if (!ok) {
        failures += 1;
      }
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures}/${CASES.length} cases failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${CASES.length} cases passed.`);
}

await main();
