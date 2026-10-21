"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CalendarCheck2,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Laptop,
  Loader2,
  Plus,
  Trash2,
  User,
  Video,
  Workflow,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Interview, InterviewRoundType, Job } from "@/types";

export type TrackedPipelineRole = {
  application_id: string;
  job_id: string;
  company: string;
  title: string;
  status: "interview" | "applied";
  match_score?: number | null;
  scheduledInterviewCount: number;
  nextInterviewAt: string | null;
  nextRoundType: string | null;
};

type Props = {
  initialInterviews: Interview[];
  savedJobs: Job[];
  pipelineRoles: TrackedPipelineRole[];
  feedUrl: string;
};

const ROUND_LABELS: Record<InterviewRoundType, string> = {
  recruiter_screen: "Recruiter Screen",
  technical: "Technical Interview",
  system_design: "System Design",
  hiring_manager: "Hiring Manager",
  behavioral: "Behavioral",
  final_round: "Final Round",
};

export function createGoogleCalendarUrl({
  title,
  description,
  location,
  startDate,
  durationMinutes,
}: {
  title: string;
  description: string;
  location?: string | null | undefined;
  startDate: Date;
  durationMinutes: number;
}): string {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const dates = `${format(startDate)}/${format(endDate)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: description,
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile({
  title,
  description,
  location,
  startDate,
  durationMinutes,
}: {
  title: string;
  description: string;
  location?: string | null | undefined;
  startDate: Date;
  durationMinutes: number;
}) {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const format = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15) + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jobbers//Job Interview Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@jobbers.com`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(startDate)}`,
    `DTEND:${format(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location || ""}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InterviewsClient({
  initialInterviews,
  savedJobs,
  pipelineRoles,
  feedUrl,
}: Props) {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Form state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [roundType, setRoundType] =
    useState<InterviewRoundType>("recruiter_screen");
  const [interviewAt, setInterviewAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const now = new Date().getTime();

  const webcalUrl = feedUrl.replace(/^https?:\/\//i, "webcal://");

  const { upcoming, past } = useMemo(() => {
    const up: Interview[] = [];
    const pa: Interview[] = [];
    for (const item of interviews) {
      const time = new Date(item.interview_at).getTime();
      if (time >= now && item.status !== "completed") {
        up.push(item);
      } else {
        pa.push(item);
      }
    }
    return {
      upcoming: up.sort(
        (a, b) =>
          new Date(a.interview_at).getTime() -
          new Date(b.interview_at).getTime(),
      ),
      past: pa.sort(
        (a, b) =>
          new Date(b.interview_at).getTime() -
          new Date(a.interview_at).getTime(),
      ),
    };
  }, [interviews, now]);

  const displayedList =
    filter === "upcoming" ? upcoming : filter === "past" ? past : interviews;

  const interviewStageRoles = useMemo(
    () => pipelineRoles.filter((r) => r.status === "interview"),
    [pipelineRoles],
  );

  const appliedRolesWithoutInterview = useMemo(
    () =>
      pipelineRoles.filter(
        (r) => r.status === "applied" && r.scheduledInterviewCount === 0,
      ),
    [pipelineRoles],
  );

  function handleSelectSavedJob(jobId: string) {
    setSelectedJobId(jobId);
    const job = savedJobs.find((j) => j.id === jobId);
    if (job) {
      setCompany(job.company || "");
      setRole(job.title || "");
    }
  }

  function openScheduleForRole(target: {
    job_id?: string | null;
    company: string;
    title: string;
  }) {
    setSelectedJobId(target.job_id || null);
    setCompany(target.company);
    setRole(target.title);
    setInterviewAt("");
    setIsModalOpen(true);
  }

  function handleCopyFeed() {
    navigator.clipboard.writeText(feedUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !interviewAt) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: selectedJobId || null,
          company,
          role,
          round_type: roundType,
          interview_at: interviewAt,
          duration_minutes: durationMinutes,
          meeting_url: meetingUrl,
          interviewer_name: interviewerName,
          interviewer_email: interviewerEmail,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.interview) {
        setInterviews((prev) => [...prev, data.interview]);
        setIsModalOpen(false);
        // Reset form
        setSelectedJobId(null);
        setCompany("");
        setRole("");
        setInterviewAt("");
        setMeetingUrl("");
        setInterviewerName("");
        setInterviewerEmail("");
        setNotes("");
      }
    } catch (err) {
      console.error("Failed to create interview", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(interview: Interview) {
    const nextStatus =
      interview.status === "completed" ? "scheduled" : "completed";
    try {
      const res = await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setInterviews((prev) =>
          prev.map((i) =>
            i.id === interview.id ? { ...i, status: nextStatus } : i,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to update interview", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this interview entry?")) return;
    try {
      const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInterviews((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete interview", err);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-muted text-accent">
              <Calendar className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Interviews & Calendar
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Keep track of upcoming rounds, store meeting links, and sync with your Google or Apple calendar in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs font-semibold">
            <Link href="/integrations" className="flex items-center gap-1.5">
              <Workflow className="h-3.5 w-3.5 text-accent" />
              <span>Calendar Sync Hub</span>
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSelectedJobId(null);
              setCompany("");
              setRole("");
              setInterviewAt("");
              setIsModalOpen(true);
            }}
            className="btn btn-primary rounded-full shrink-0 font-bold"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </header>

      {/* Calendar Integration Banner */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-accent-muted/20 via-surface to-surface p-5 shadow-card sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-2xs">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary">
                Live Calendar Feed Integration
              </h2>
              <span className="rounded-full bg-success-lightest px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                Active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-text-muted leading-relaxed">
              Auto-syncs every round into Google Calendar, Apple Calendar, and Outlook via live RFC 5545 feed.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyFeed}
            className="rounded-xl text-xs"
          >
            {copiedFeed ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-success" />
                iCal Feed Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Live iCal URL
              </>
            )}
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-xl text-xs font-semibold"
          >
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
                webcalUrl,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Subscribe in Google
            </a>
          </Button>
        </div>
      </section>

      {/* Tracked Job Pipeline Integration Section */}
      {interviewStageRoles.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Tracked Pipeline Roles in Interview Stage ({interviewStageRoles.length})
                </h3>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Roles moved to the &quot;Interview&quot; stage in your applications pipeline. Check dates or log your next round.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {interviewStageRoles.map((roleItem) => {
              const hasScheduled = roleItem.scheduledInterviewCount > 0;
              const formattedDate = roleItem.nextInterviewAt
                ? new Date(roleItem.nextInterviewAt).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )
                : null;

              return (
                <div
                  key={roleItem.job_id}
                  className={`flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all ${
                    hasScheduled
                      ? "border-border bg-surface-secondary/20"
                      : "border-warning/40 bg-warning/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {roleItem.company}
                      </h4>
                      <p className="text-xs font-medium text-text-secondary">
                        {roleItem.title}
                      </p>
                    </div>

                    {hasScheduled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-2.5 py-0.5 text-[11px] font-semibold text-success-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        {roleItem.scheduledInterviewCount}{" "}
                        {roleItem.scheduledInterviewCount === 1
                          ? "Round"
                          : "Rounds"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                        <AlertCircle className="h-3 w-3" />
                        Date Needed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/70 pt-2.5 text-xs">
                    {hasScheduled ? (
                      <span className="text-text-muted">
                        Next:{" "}
                        <strong className="text-text-primary">
                          {formattedDate}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-warning font-medium">
                        No upcoming round date logged
                      </span>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant={hasScheduled ? "outline" : "default"}
                      onClick={() =>
                        openScheduleForRole({
                          job_id: roleItem.job_id,
                          company: roleItem.company,
                          title: roleItem.title,
                        })
                      }
                      className="rounded-lg text-xs py-1 h-7 font-semibold"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {hasScheduled ? "Add Next Round" : "Schedule Round"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Applied Roles Quick Launcher (if user has applied jobs awaiting interview) */}
      {appliedRolesWithoutInterview.length > 0 && interviewStageRoles.length === 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-surface-secondary/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-text-primary">
                Applied to {appliedRolesWithoutInterview.length} roles on Jobbers
              </p>
              <p className="text-xs text-text-muted">
                Did an employer reach out? Schedule an interview and the role will automatically advance to your Interview pipeline.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const targetJob = appliedRolesWithoutInterview.find(
                    (j) => j.job_id === e.target.value,
                  );
                  if (targetJob) {
                    openScheduleForRole(targetJob);
                  }
                }}
                defaultValue=""
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="" disabled>
                  Select an applied role…
                </option>
                {appliedRolesWithoutInterview.map((job) => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.company} — {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Filter Tabs & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter("upcoming")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "upcoming"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("past")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "past"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Past & Completed ({past.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            All Rounds ({interviews.length})
          </button>
        </div>

        <span className="text-xs font-medium text-text-muted">
          Showing {displayedList.length} of {interviews.length} rounds
        </span>
      </div>

      {/* Interview List View (Strictly list/cards, no Kanban, no charts) */}
      {displayedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <CalendarCheck2 className="h-7 w-7" />
          </div>
          <p className="mt-4 text-base font-semibold text-text-primary">
            {filter === "upcoming"
              ? "No upcoming interviews scheduled"
              : filter === "past"
                ? "No completed or past interviews"
                : "No interviews recorded yet"}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-text-muted">
            Track interview rounds, store Google Meet / Zoom links, and sync with your calendar automatically.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary mt-6 rounded-full font-bold"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Schedule an Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedList.map((interview) => {
            const date = new Date(interview.interview_at);
            const dateStr = date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = date.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            });

            const isPast = date.getTime() < now;
            const isCompleted = interview.status === "completed";

            const googleCalUrl = createGoogleCalendarUrl({
              title: `${interview.company} Interview: ${ROUND_LABELS[interview.round_type] || interview.round_type}`,
              description: `Interview for ${interview.role} at ${interview.company}.\nMeeting URL: ${interview.meeting_url || "N/A"}\nNotes: ${interview.notes || "None"}`,
              location: interview.meeting_url || undefined,
              startDate: date,
              durationMinutes: interview.duration_minutes || 45,
            });

            return (
              <div
                key={interview.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:border-border-muted ${
                  isCompleted ? "opacity-75" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent">
                        {ROUND_LABELS[interview.round_type] ||
                          interview.round_type}
                      </span>
                      {isCompleted ? (
                        <span className="rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
                          Completed
                        </span>
                      ) : isPast ? (
                        <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                          Past Due
                        </span>
                      ) : (
                        <span className="rounded-full bg-info-lightest px-2.5 py-0.5 text-xs font-semibold text-info-medium">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-text-primary">
                      {interview.company}
                    </h3>
                    <p className="text-sm font-medium text-text-secondary">
                      {interview.role}
                    </p>
                  </div>

                  {/* Date & Time pill */}
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs text-text-primary sm:flex-col sm:items-end sm:border-0 sm:bg-transparent sm:p-0">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      <span>{dateStr}</span>
                    </div>
                    <span className="text-text-muted">
                      {timeStr} ({interview.duration_minutes}m)
                    </span>
                  </div>
                </div>

                {/* Details strip */}
                {(interview.interviewer_name ||
                  interview.meeting_url ||
                  interview.notes) && (
                  <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border/80 bg-surface-secondary/30 p-3 text-xs sm:grid-cols-2">
                    {interview.interviewer_name && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <User className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        <span className="truncate">
                          Interviewer:{" "}
                          <strong className="text-text-primary font-semibold">
                            {interview.interviewer_name}
                          </strong>
                          {interview.interviewer_email
                            ? ` (${interview.interviewer_email})`
                            : ""}
                        </span>
                      </div>
                    )}

                    {interview.meeting_url && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Video className="h-3.5 w-3.5 text-accent shrink-0" />
                        <a
                          href={interview.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-accent hover:underline flex items-center gap-1"
                        >
                          Join Meeting ({interview.meeting_url})
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {interview.notes && (
                      <p className="col-span-full text-text-muted italic">
                        &quot;{interview.notes}&quot;
                      </p>
                    )}
                  </div>
                )}

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {interview.meeting_url && (
                      <Button
                        asChild
                        size="sm"
                        className="rounded-full text-xs font-semibold"
                      >
                        <a
                          href={interview.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Video className="mr-1.5 h-3.5 w-3.5" />
                          Launch Meeting
                        </a>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                    >
                      <a href={googleCalUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Google Calendar
                      </a>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadIcsFile({
                          title: `${interview.company} Interview (${ROUND_LABELS[interview.round_type] || interview.round_type})`,
                          description: `Interview for ${interview.role}.\nMeeting URL: ${interview.meeting_url || "N/A"}`,
                          location: interview.meeting_url || undefined,
                          startDate: date,
                          durationMinutes: interview.duration_minutes || 45,
                        })
                      }
                      className="rounded-full text-xs"
                    >
                      <Laptop className="mr-1.5 h-3.5 w-3.5" />
                      Add to Apple/Outlook
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(interview)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isCompleted
                          ? "bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80"
                          : "bg-success-lightest text-success-foreground hover:bg-success-lightest/80"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      {isCompleted ? "Mark Scheduled" : "Mark Completed"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(interview.id)}
                      className="rounded-lg p-1.5 text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-accent" />
                <h3 className="text-base font-bold text-text-primary">
                  Schedule Interview Round
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              {/* Autofill from saved/pipeline jobs */}
              {savedJobs.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Link with Tracked Platform Role (Optional)
                  </label>
                  <select
                    value={selectedJobId || ""}
                    onChange={(e) => handleSelectSavedJob(e.target.value)}
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="">-- Choose from your tracked roles --</option>
                    {savedJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Round Type *
                  </label>
                  <select
                    value={roundType}
                    onChange={(e) =>
                      setRoundType(e.target.value as InterviewRoundType)
                    }
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    {Object.entries(ROUND_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hour)</option>
                    <option value={90}>90 minutes (1.5 hours)</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Date and Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewAt}
                  onChange={(e) => setInterviewAt(e.target.value)}
                  className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Meeting URL / Video Link (Optional)
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/... or zoom.us/j/..."
                  className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Interviewer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Interviewer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={interviewerEmail}
                    onChange={(e) => setInterviewerEmail(e.target.value)}
                    placeholder="e.g. recruiter@company.com"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Preparation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Focus areas, system design topics, questions to ask..."
                  className="rounded-xl border border-border bg-surface-secondary/40 p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary rounded-full text-xs font-bold"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Save & Sync Round
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
