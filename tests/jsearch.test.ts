import assert from "node:assert/strict";
import { test } from "node:test";

import { buildJsearchParams, searchJsearch } from "../lib/jobs/jsearch.ts";
import type { JobSearchQuery } from "../lib/jobs/types.ts";

const query: JobSearchQuery = {
  title: "frontend developer",
  location: "Lagos, Nigeria",
  country: "ng",
};

function withEnv(key: string, value: string | undefined, run: () => Promise<void>): Promise<void> {
  const previous = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  return run().finally(() => {
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  });
}

test("query string puts title and location into one Google-friendly phrase", () => {
  const params = buildJsearchParams(query);
  assert.equal(params.get("query"), "frontend developer jobs in Lagos, Nigeria");
  assert.equal(params.get("country"), "ng");
  assert.equal(params.get("num_pages"), "1");
});

test("missing location falls back to a bare jobs query", () => {
  const params = buildJsearchParams({ title: "Data Analyst", location: "  ", country: "" });
  assert.equal(params.get("query"), "Data Analyst jobs");
  // Empty country must fall back to the API default, not an empty param.
  assert.equal(params.get("country"), "us");
});

test("country codes are lowercased for the endpoint", () => {
  assert.equal(buildJsearchParams({ ...query, country: " GB " }).get("country"), "gb");
});

test("num_pages is clamped to the documented 1-20 range", () => {
  assert.equal(buildJsearchParams(query, 0).get("num_pages"), "1");
  assert.equal(buildJsearchParams(query, -5).get("num_pages"), "1");
  assert.equal(buildJsearchParams(query, 3).get("num_pages"), "3");
  assert.equal(buildJsearchParams(query, 99).get("num_pages"), "20");
  assert.equal(buildJsearchParams(query, Number.NaN).get("num_pages"), "1");
});

test("remoteOnly maps to the spec's work_from_home flag", () => {
  // The only source that can filter remote server-side — the public route's
  // "Remote" chip relies on it (plan A7 / public-jobs rewire).
  assert.equal(buildJsearchParams({ ...query, remoteOnly: true }).get("work_from_home"), "true");
  // Absent by default: no stray param consuming URL length or confusing the API.
  assert.equal(buildJsearchParams(query).get("work_from_home"), null);
});

test("missing API key fails fast with an actionable message", async () => {
  await withEnv("JSEARCH_API_KEY", undefined, async () => {
    await assert.rejects(searchJsearch(query), /JSEARCH_API_KEY is not set/);
  });
});

test("401 surfaces as a key problem, not a generic failure", async () => {
  await withEnv("JSEARCH_API_KEY", "test-key", async () => {
    const fetchImpl: typeof fetch = async () => new Response("{}", { status: 401 });
    await assert.rejects(searchJsearch(query, { fetchImpl }), /rejected the API key/);
  });
});

test("429 surfaces as the monthly quota, distinct from auth errors", async () => {
  await withEnv("JSEARCH_API_KEY", "test-key", async () => {
    const fetchImpl: typeof fetch = async () => new Response("{}", { status: 429 });
    await assert.rejects(searchJsearch(query, { fetchImpl }), /rate limit or monthly quota/);
  });
});

test("a 200 with a non-JSON body is reported clearly", async () => {
  await withEnv("JSEARCH_API_KEY", "test-key", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response("<html>gateway error</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    await assert.rejects(searchJsearch(query, { fetchImpl }), /not valid JSON/);
  });
});

test("successful search sends the key header, endpoint and query params", async () => {
  await withEnv("JSEARCH_API_KEY", "test-key", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    const fetchImpl: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedInit = init;
      return new Response(
        JSON.stringify({
          status: "OK",
          data: {
            jobs: [
              {
                job_id: "j1",
                job_title: "Frontend Developer",
                employer_name: "Acme",
                job_apply_link: "https://acme.example/apply/1",
                job_description: "Build things",
              },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const jobs = await searchJsearch(query, { fetchImpl });

    assert.ok(capturedUrl.startsWith("https://api.openwebninja.com/jsearch/search-v2?"));
    assert.ok(capturedUrl.includes("frontend+developer+jobs+in+Lagos%2C+Nigeria") ||
      capturedUrl.includes("frontend developer jobs in Lagos, Nigeria"));
    const headers = new Headers(capturedInit?.headers);
    assert.equal(headers.get("x-api-key"), "test-key");
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]!.source, "jsearch");
    assert.equal(jobs[0]!.applyUrl, "https://acme.example/apply/1");
  });
});
