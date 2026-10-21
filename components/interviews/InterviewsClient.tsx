"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CalendarCheck2,
  CalendarPlus,
  Check,
  Clock,
  ExternalLink,
  Laptop,
  Loader2,
  Plus,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Interview, InterviewRoundType, Job } from "@/types";

type Props = {
  initialInterviews: Interview[];
  savedJobs: Job[];
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
  location?: string;
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
  location?: string;
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

export function InterviewsClient({ initialInterviews, savedJobs }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
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

  function handleSelectSavedJob(jobId: string) {
    const job = savedJobs.find((j) => j.id === jobId);
    if (job) {
      setCompany(job.company || "");
      setRole(job.title || "");
    }
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
              Interviews & Schedule
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Keep track of upcoming rounds, store meeting links, and sync with your Google or Outlook calendar in 1 click.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary rounded-full shrink-0 font-bold"
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </header>

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
            All ({interviews.length})
          </button>
        </div>
      </div>

      {/* Interview Cards List */}
      {displayedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted text-accent">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-text-primary">
            {filter === "upcoming"
              ? "No upcoming interviews scheduled"
              : "No past interviews found"}
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-text-muted">
            Add an upcoming recruiter chat, technical round, or final interview to sync it with your calendar.
          </p>
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-sm mt-5 rounded-full"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Schedule your first interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedList.map((item) => {
            const dateObj = new Date(item.interview_at);
            const isCompleted = item.status === "completed";
            const calTitle = `${item.company} Interview: ${item.role} (${ROUND_LABELS[item.round_type] || item.round_type})`;
            const calDesc = `Interview for ${item.role} at ${item.company}.\nRound: ${ROUND_LABELS[item.round_type] || item.round_type}\nInterviewer: ${item.interviewer_name || "N/A"}\nNotes: ${item.notes || "None"}\nMeeting Link: ${item.meeting_url || "N/A"}`;
            const gcalUrl = createGoogleCalendarUrl({
              title: calTitle,
              description: calDesc,
              location: item.meeting_url || item.company,
              startDate: dateObj,
              durationMinutes: item.duration_minutes,
            });

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 shadow-card transition-all ${
                  isCompleted
                    ? "border-border/60 bg-surface/60 opacity-80"
                    : "border-border bg-surface hover:border-border-muted"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-muted text-accent">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-text-primary">
                          {item.role}
                        </h3>
                        <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-[11px] font-bold text-accent">
                          {ROUND_LABELS[item.round_type] || item.round_type}
                        </span>
                        {isCompleted && (
                          <span className="rounded-full bg-success-lightest px-2.5 py-0.5 text-[11px] font-bold text-success-darker">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-text-secondary">
                        {item.company}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1.5 font-medium text-text-primary">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {dateObj.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {dateObj.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          ({item.duration_minutes}m)
                        </span>

                        {item.interviewer_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {item.interviewer_name}
                            {item.interviewer_email && ` (${item.interviewer_email})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meeting link trigger */}
                  {item.meeting_url && (
                    <a
                      href={item.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm rounded-full shrink-0 gap-1.5 font-semibold"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Meeting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Notes box */}
                {item.notes && (
                  <div className="rounded-xl border border-border/70 bg-surface-secondary/40 p-3 text-xs leading-relaxed text-text-secondary">
                    <span className="font-semibold text-text-primary">Prep Notes: </span>
                    {item.notes}
                  </div>
                )}

                {/* Bottom Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm rounded-full gap-1.5 text-xs font-medium"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Add to Google Calendar
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        downloadIcsFile({
                          title: calTitle,
                          description: calDesc,
                          location: item.meeting_url || item.company,
                          startDate: dateObj,
                          durationMinutes: item.duration_minutes,
                        })
                      }
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                    >
                      Download .ics
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`btn btn-sm rounded-full text-xs font-medium ${
                        isCompleted ? "btn-secondary" : "btn-secondary text-success-darker hover:border-success"
                      }`}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      {isCompleted ? "Mark as Upcoming" : "Mark as Completed"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-text-muted hover:bg-error-light hover:text-error"
                      title="Delete interview"
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

      {/* SCHEDULE INTERVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-text-primary">
                Schedule New Interview
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              {/* Autofill from saved jobs dropdown */}
              {savedJobs.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Quick-fill from Saved Jobs (Optional)
                  </label>
                  <select
                    onChange={(e) => handleSelectSavedJob(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="">Select a saved role...</option>
                    {savedJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe, Linear"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
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
                    placeholder="e.g. Frontend Engineer"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Round Type *
                  </label>
                  <select
                    value={roundType}
                    onChange={(e) =>
                      setRoundType(e.target.value as InterviewRoundType)
                    }
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    {Object.entries(ROUND_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
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
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Interview Date & Time *
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
                  Meeting Link (Zoom / Google Meet / Teams)
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/... or https://zoom.us/..."
                  className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Interviewer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
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
                    placeholder="e.g. sarah@company.com"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Prep Notes / Talking Points
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key topics, company values to reference, or questions to ask..."
                  className="rounded-xl border border-border bg-surface-secondary/40 p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary btn-sm rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm rounded-full font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Interview"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
