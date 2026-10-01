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
  return data.results ?? [];
}
