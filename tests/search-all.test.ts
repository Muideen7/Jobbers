import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_CACHE_ENTRIES,
  PROVIDER_REGISTRY,
  createSearchAllState,
  dedupeNormalizedJobs,
  extractQueryTokens,
  searchAll,
} from "../lib/jobs/search-all.ts";
import type {
  JobProvider,
  JobSearchQuery,
  JobSourceId,
  NormalizedJob,
} from "../lib/jobs/types.ts";

const query: JobSearchQuery = {
  title: "frontend developer",
  location: "Lagos",
  country: "ng",
};

function makeJob(
  overrides: Partial<NormalizedJob> & {
    source: JobSourceId;
    externalId: string;
    title: string;
  },
): NormalizedJob {
  return {
    company: "Acme",
    location: "Remote",
    description: "short description",
    applyUrl: "https://acme.example/apply",
    sourceUrl: "https://acme.example/job",
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    salaryText: null,
    category: null,
    postedAt: null,
    employmentType: null,
    remote: false,
    highlights: { responsibilities: [], requirements: [], benefits: [] },
    ...overrides,
  };
}

function countingProvider(
  id: JobSourceId,
  jobs: NormalizedJob[],
  options: { fail?: boolean; searchMode?: JobProvider["searchMode"] } = {},
): JobProvider & { calls: () => number } {
  let calls = 0;
  return {
    id,
    searchMode: options.searchMode ?? "server",
    async search() {
      calls += 1;
      if (options.fail) {
        throw new Error(`${id} is down`);
      }
      return jobs;
    },
    calls: () => calls,
  };
}

test("one failing provider never takes the others down", async () => {
  const goodA = countingProvider("adzuna", [
    makeJob({ source: "adzuna", externalId: "a1", title: "Frontend Developer" }),
  ]);
  const failing = countingProvider("jsearch", [], { fail: true });
  const goodB = countingProvider("arbeitnow", [
    makeJob({ source: "arbeitnow", externalId: "b1", title: "UI Engineer" }),
  ]);

  const result = await searchAll(query, {
    providers: [goodA, failing, goodB],
    state: createSearchAllState(),
  });

  assert.equal(result.jobs.length, 2);
  assert.deepEqual(
    result.outcomes.map((o) => o.source),
    ["adzuna", "jsearch", "arbeitnow"],
  );
  const failed = result.outcomes.find((o) => o.source === "jsearch");
  assert.equal(failed?.count, 0);
  assert.match(failed?.error ?? "", /jsearch is down/);
  const okA = result.outcomes.find((o) => o.source === "adzuna");
  assert.equal(okA?.error, undefined);
});

test("cross-source duplicates collapse and the fuller description wins", async () => {
  const collapsed = await searchAll(query, {
    providers: [
      countingProvider("adzuna", [
        makeJob({
          source: "adzuna",
          externalId: "a1",
          title: "Frontend Developer",
          company: "Moniepoint",
          description: "snippet",
        }),
      ]),
      countingProvider("jsearch", [
        makeJob({
          source: "jsearch",
          externalId: "j1",
          title: "frontend developer",
          company: "Moniepoint",
          description: "a much longer full description of the role",
        }),
      ]),
    ],
    state: createSearchAllState(),
  });

  assert.equal(collapsed.jobs.length, 1);
  assert.equal(collapsed.jobs[0]!.source, "jsearch");
  assert.equal(collapsed.jobs[0]!.description, "a much longer full description of the role");

  // Distinct employers with the same title must survive the dedupe.
  const distinct = await searchAll(query, {
    providers: [
      countingProvider("adzuna", [
        makeJob({ source: "adzuna", externalId: "a2", title: "Frontend Developer", company: "Moniepoint" }),
      ]),
      countingProvider("jsearch", [
        makeJob({ source: "jsearch", externalId: "j2", title: "Frontend Developer", company: "Paystack" }),
      ]),
    ],
    state: createSearchAllState(),
  });
  assert.equal(distinct.jobs.length, 2);
});

test("dedupe skips jobs with empty titles", () => {
  const jobs = dedupeNormalizedJobs([
    makeJob({ source: "adzuna", externalId: "1", title: "   " }),
    makeJob({ source: "adzuna", externalId: "2", title: "Designer" }),
  ]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]!.externalId, "2");
});

test("identical query hits the cache instead of the upstream API", async () => {
  const provider = countingProvider("remoteok", [
    makeJob({ source: "remoteok", externalId: "r1", title: "Frontend Developer" }),
  ]);
  const state = createSearchAllState();

  const first = await searchAll(query, { providers: [provider], state });
  const second = await searchAll(query, { providers: [provider], state });

  assert.equal(provider.calls(), 1);
  assert.equal(first.jobs.length, 1);
  assert.equal(second.jobs.length, 1);
  assert.equal(second.outcomes[0]?.error, undefined);
});

test("expired cache entries trigger a fresh upstream call", async () => {
  const provider = countingProvider("remoteok", [
    makeJob({ source: "remoteok", externalId: "r1", title: "Frontend Developer" }),
  ]);
  const state = createSearchAllState();
  let currentTime = 1_000_000;

  const options = {
    providers: [provider],
    state,
    sourceTtlMs: { remoteok: 1_000 },
    now: () => currentTime,
  };

  await searchAll(query, options);
  currentTime += 500;
  await searchAll(query, options);
  assert.equal(provider.calls(), 1, "fresh entry must be served from cache");

  currentTime += 600;
  await searchAll(query, options);
  assert.equal(provider.calls(), 2, "expired entry must refetch");
});

test("client-mode feeds are token-filtered, server-mode sources are not", async () => {
  const matching = makeJob({
    source: "remoteok",
    externalId: "r1",
    title: "Senior Frontend Developer",
  });
  const irrelevant = makeJob({
    source: "remoteok",
    externalId: "r2",
    title: "Registered Nurse Practitioner",
  });
  const clientFeed = countingProvider("remoteok", [matching, irrelevant], {
    searchMode: "client",
  });
  const serverSource = countingProvider("adzuna", [
    // Server sources already matched the query — keep whatever they return.
    makeJob({ source: "adzuna", externalId: "a1", title: "Backend Engineer" }),
  ]);

  const result = await searchAll(query, {
    providers: [clientFeed, serverSource],
    state: createSearchAllState(),
  });

  const titles = result.jobs.map((job) => job.title);
  assert.ok(titles.includes("Senior Frontend Developer"));
  assert.ok(!titles.includes("Registered Nurse Practitioner"));
  assert.ok(titles.includes("Backend Engineer"));
});

test("queries too short to tokenize disable the client filter", async () => {
  const feed = countingProvider(
    "remoteok",
    [makeJob({ source: "remoteok", externalId: "r1", title: "Anything At All" })],
    { searchMode: "client" },
  );

  const result = await searchAll(
    { title: "AI", location: "", country: "us" },
    { providers: [feed], state: createSearchAllState() },
  );

  assert.equal(result.jobs.length, 1);
  assert.deepEqual(extractQueryTokens("AI"), []);
});

test("maxResults caps the merged list", async () => {
  const provider = countingProvider("arbeitnow", [
    makeJob({ source: "arbeitnow", externalId: "1", title: "Frontend One" }),
    makeJob({ source: "arbeitnow", externalId: "2", title: "Frontend Two" }),
    makeJob({ source: "arbeitnow", externalId: "3", title: "Frontend Three" }),
  ]);

  const result = await searchAll(query, {
    providers: [provider],
    maxResults: 2,
    state: createSearchAllState(),
  });

  assert.equal(result.jobs.length, 2);
});

test("a daily source cap stops further upstream calls that UTC day", async () => {
  const provider = countingProvider("remotive", [
    makeJob({ source: "remotive", externalId: "m1", title: "Frontend Developer" }),
  ]);
  const state = createSearchAllState();

  const options = {
    providers: [provider],
    state,
    dailyLimits: { remotive: 1 },
    now: () => Date.parse("2026-10-06T10:00:00Z"),
  };

  const first = await searchAll(query, options);
  assert.equal(provider.calls(), 1);
  assert.equal(first.jobs.length, 1);

  // Different title → different cache key, so only the daily cap can stop it.
  const second = await searchAll(
    { ...query, title: "backend developer" },
    options,
  );
  assert.equal(provider.calls(), 1, "cap must prevent the second upstream call");
  assert.equal(second.jobs.length, 0);
  assert.match(second.outcomes[0]?.error ?? "", /daily source cap/);

  // Same day cap, next UTC day it resets.
  const tomorrow = await searchAll(
    { ...query, title: "designer" },
    { ...options, now: () => Date.parse("2026-10-07T10:00:00Z") },
  );
  assert.equal(provider.calls(), 2);
  assert.equal(tomorrow.jobs.length, 1);
});

test("the cache never grows past MAX_CACHE_ENTRIES", async () => {
  const provider = countingProvider("arbeitnow", [
    makeJob({ source: "arbeitnow", externalId: "1", title: "Frontend Developer" }),
  ]);
  const state = createSearchAllState();

  for (let i = 0; i < MAX_CACHE_ENTRIES + 5; i++) {
    await searchAll(
      { ...query, title: `frontend developer ${i}` },
      { providers: [provider], state },
    );
  }

  assert.ok(
    state.entries.size <= MAX_CACHE_ENTRIES,
    `expected ≤ ${MAX_CACHE_ENTRIES} entries, got ${state.entries.size}`,
  );
});

test("the default registry leads with JSearch and demotes Adzuna to last", () => {
  // Adzuna serves only 19 countries — it must never again be the core source
  // (it cannot serve Nigeria at all). Locks in the demotion from plan A7.
  assert.equal(PROVIDER_REGISTRY[0]?.id, "jsearch");
  assert.equal(PROVIDER_REGISTRY[PROVIDER_REGISTRY.length - 1]?.id, "adzuna");
  assert.ok(
    !PROVIDER_REGISTRY.slice(0, -1).some((p) => p.id === "adzuna"),
    "adzuna must appear exactly once, in the fallback slot",
  );
});
