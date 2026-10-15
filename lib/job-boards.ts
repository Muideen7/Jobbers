/**
 * Comprehensive job board / source registry matching the multi-source catalogue.
 * All boards use either:
 * 1. Keyless public feeds / free APIs (RemoteOK, Remotive, Arbeitnow, Jobicy, HN)
 * 2. 1-free-key tier (JSearch, Adzuna)
 * 3. Direct ATS / Company domains (Greenhouse, Lever, Ashby, Workday, Workable)
 */

import type { Job } from "../types/index.ts";

export type JobBoardItem = {
  id: string;
  label: string;
  domainPatterns?: string[];
  sourceIds?: string[];
};

export const JOB_BOARDS: readonly JobBoardItem[] = [
  {
    id: "direct",
    label: "Direct from company",
    domainPatterns: [
      "greenhouse.io",
      "lever.co",
      "ashbyhq.com",
      "workday.com",
      "myworkdayjobs.com",
      "smartrecruiters.com",
      "bamboohr.com",
      "applytojob.com",
      "taleo.net",
    ],
  },
  {
    id: "remoteok",
    label: "RemoteOK",
    sourceIds: ["remoteok"],
    domainPatterns: ["remoteok.com", "remoteok.io"],
  },
  {
    id: "remotive",
    label: "Remotive",
    sourceIds: ["remotive"],
    domainPatterns: ["remotive.com", "remotive.io"],
  },
  {
    id: "arbeitnow",
    label: "Arbeitnow",
    sourceIds: ["arbeitnow"],
    domainPatterns: ["arbeitnow.com"],
  },
  {
    id: "jobicy",
    label: "Jobicy",
    sourceIds: ["jobicy"],
    domainPatterns: ["jobicy.com"],
  },
  {
    id: "adzuna",
    label: "Adzuna",
    sourceIds: ["adzuna", "search"],
    domainPatterns: ["adzuna.com", "adzuna.co.uk"],
  },
  {
    id: "jsearch",
    label: "Google for Jobs",
    sourceIds: ["jsearch"],
    domainPatterns: ["google.com", "openwebninja.com"],
  },
  {
    id: "weworkremotely",
    label: "We Work Remotely",
    domainPatterns: ["weworkremotely.com"],
  },
  {
    id: "hackernews",
    label: "Hacker News",
    domainPatterns: ["news.ycombinator.com"],
  },
  {
    id: "workable",
    label: "Workable",
    domainPatterns: ["workable.com", "apply.workable.com"],
  },
  {
    id: "ycombinator",
    label: "Y Combinator",
    domainPatterns: ["ycombinator.com", "workatastartup.com"],
  },
  {
    id: "startupjobs",
    label: "Startup Jobs",
    domainPatterns: ["startup.jobs", "wellfound.com", "angel.co"],
  },
  {
    id: "himalayas",
    label: "Himalayas",
    domainPatterns: ["himalayas.app"],
  },
  {
    id: "pythonjobs",
    label: "Python.org Jobs",
    domainPatterns: ["python.org"],
  },
] as const;

/**
 * Checks whether a job matches a selected job board id.
 */
export function matchesJobBoard(job: Job, boardId: string): boolean {
  if (!boardId || boardId === "all") return true;

  const board = JOB_BOARDS.find((b) => b.id === boardId);
  if (!board) return true;

  const jobSource = (job.source ?? "").toLowerCase();
  if (board.sourceIds && board.sourceIds.includes(jobSource)) {
    return true;
  }

  const urls = [job.source_url, job.external_apply_url]
    .filter((u): u is string => typeof u === "string" && u.length > 0)
    .map((u) => u.toLowerCase());

  if (board.domainPatterns && board.domainPatterns.length > 0) {
    for (const pattern of board.domainPatterns) {
      if (urls.some((url) => url.includes(pattern))) {
        return true;
      }
    }
  }

  return false;
}
