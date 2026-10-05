export type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1";
  contract_type?: string;
  created: string;
  category: { tag: string; label: string };
};

export type AdzunaSearchOptions = {
  resultsPerPage?: number;
  contractType?: "full_time" | "part_time" | "contract" | "temp" | "intern";
  salaryMin?: number;
  sortBy?: "date" | "salary";
};

/**
 * Adzuna multi-location postings: one requisition posted to N sites is returned as N
 * separate ads, each with its own id, lat/long and a per-location salary guess, but with
 * an identical title, company and description. Twenty raw results can be eight real jobs.
 */
const DESCRIPTION_FINGERPRINT_CHARS = 200;

function normalizeForFingerprint(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function fingerprint(job: AdzunaJob): string {
  return [
    normalizeForFingerprint(job.title),
    normalizeForFingerprint(job.company?.display_name ?? ""),
    normalizeForFingerprint(job.description ?? "").slice(
      0,
      DESCRIPTION_FINGERPRINT_CHARS,
    ),
  ].join("|");
}

/**
 * Aggregators append their own branding to the company name ("SimVentions, Inc -
 * Glassdoor ✪ 4.6"). The rating suffix and the trailing " - <source>" segment are not
 * part of the employer name and would otherwise leak into the UI and into Gemini
 * scoring prompts as if they were part of the company.
 */
export function cleanCompanyName(displayName: string): string {
  const withoutRating = displayName.replace(/\s*[✪★]\s*\d+(?:\.\d+)?\s*$/, "").trim();

  if (!withoutRating.includes(" - ")) {
    return withoutRating;
  }

  const segments = withoutRating.split(" - ");
  // split() on a string known to contain " - " always yields a first element,
  // but the fallback keeps this honest without asserting the index away.
  const head = (segments[0] ?? withoutRating).trim();

  // Only strip a suffix when the remainder looks like an aggregator/board name rather
  // than a legal or trading name that legitimately contains a hyphen.
  const remainderLooksLikeSource = segments
    .slice(1)
    .join(" - ")
    .split(/[\s,]+/)
    .some((word) =>
      /glassdoor|indeed|linkedin|ziprecruiter|monster|glassdoor|job|source|board|careers?/i.test(
        word,
      ),
    );

  return remainderLooksLikeSource && head.length > 0 ? head : withoutRating;
}

/**
 * Collapses multi-location duplicates into a single representative ad, preferring the
 * copy with the highest stated salary so the card shows the best available figure
 * rather than whichever location happened to rank first.
 */
export function dedupeAdzunaJobs(jobs: AdzunaJob[]): AdzunaJob[] {
  const best = new Map<string, AdzunaJob>();

  for (const job of jobs) {
    const key = fingerprint(job);
    const incumbent = best.get(key);

    if (!incumbent) {
      best.set(key, job);
      continue;
    }

    const incumbentSalary = incumbent.salary_max ?? incumbent.salary_min ?? 0;
    const challengerSalary = job.salary_max ?? job.salary_min ?? 0;

    if (challengerSalary > incumbentSalary) {
      best.set(key, job);
    }
  }

  return [...best.values()];
}

export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
  options: AdzunaSearchOptions = {},
): Promise<AdzunaJob[]> {
  const {
    resultsPerPage = 10,
    contractType,
    salaryMin,
    sortBy,
  } = options;

  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: jobTitle,
    category: "it-jobs",
    results_per_page: String(resultsPerPage),
    "content-type": "application/json",
  });

  if (location) {
    params.set("where", location);
  }

  if (contractType) {
    params.set("contract_type", contractType);
  }

  if (typeof salaryMin === "number" && salaryMin > 0) {
    params.set("salary_min", String(salaryMin));
  }

  if (sortBy) {
    params.set("sort_by", sortBy);
  }

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = (await response.json()) as { results?: AdzunaJob[] };
  return dedupeAdzunaJobs(data.results ?? []);
}
