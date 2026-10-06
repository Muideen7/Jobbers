/**
 * Shared shape every job source must produce before its results can enter the
 * matcher, the public jobs endpoint or the database. Providers translate their
 * native payloads (Adzuna ads, JSearch postings, …) into NormalizedJob so
 * downstream code never branches on where a job came from.
 *
 * See context/job-search-expansion-plan.md (Phase A).
 */

export type JobSourceId =
  | "adzuna"
  | "jsearch"
  | "arbeitnow"
  | "remoteok"
  | "remotive"
  | "jobicy";

export type JobHighlights = {
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
};

export type NormalizedJob = {
  source: JobSourceId;
  /** Stable id within the source — used for dedupe keys. */
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  /** Primary URL the candidate applies at. */
  applyUrl: string;
  /** URL of the original listing when it differs from applyUrl. */
  sourceUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  /** Salary period as published: HOUR | DAY | WEEK | MONTH | YEAR, or null. */
  salaryPeriod: string | null;
  /** Source's own free-form salary text ("$45-$120/Hour") when it provides one. */
  salaryText: string | null;
  /** Source's own category/industry label ("IT Jobs", "Cybersecurity"), or null. */
  category: string | null;
  /** ISO 8601 UTC datetime the job was posted, or null when unknown. */
  postedAt: string | null;
  /** FULLTIME | CONTRACTOR | PARTTIME | INTERN, source-native, or null. */
  employmentType: string | null;
  remote: boolean;
  highlights: JobHighlights;
};

export type JobSearchQuery = {
  title: string;
  location: string;
  /** ISO 3166-1 alpha-2 country code ("us", "ng", …). Empty falls back per provider. */
  country: string;
  /**
   * Restrict to remote/wfh roles. Only JSearch honours it server-side
   * (`work_from_home`); other sources ignore it and callers post-filter on
   * NormalizedJob.remote.
   */
  remoteOnly?: boolean;
};

export type JobProvider = {
  id: JobSourceId;
  /**
   * "server" — the upstream API matches the query itself (Adzuna `what`,
   * JSearch `query`). "client" — the feed returns everything and the
   * orchestrator applies the token filter locally.
   */
  searchMode: "server" | "client";
  search(query: JobSearchQuery): Promise<NormalizedJob[]>;
};
