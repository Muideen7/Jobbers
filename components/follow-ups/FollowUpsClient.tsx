"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  Clock,
  Copy,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  Plus,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type {
  Communication,
  CommunicationChannel,
  CommunicationStatus,
  Job,
} from "@/types";

type Props = {
  initialCommunications: Communication[];
  savedJobs: Job[];
};

const STATUS_CONFIG: Record<
  CommunicationStatus,
  { label: string; badgeClass: string }
> = {
  needs_reply: {
    label: "Needs Reply",
    badgeClass: "bg-warning-light text-warning-dark border-warning",
  },
  follow_up_due: {
    label: "Follow-up Due",
    badgeClass: "bg-rose-soft text-rose-strong border-rose",
  },
  waiting: {
    label: "Waiting on Employer",
    badgeClass: "bg-surface-secondary text-text-secondary border-border",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-success-lightest text-success-darker border-success",
  },
};

export function FollowUpsClient({
  initialCommunications,
  savedJobs,
}: Props) {
  const [communications, setCommunications] = useState<Communication[]>(
    initialCommunications,
  );
  const [filter, setFilter] = useState<"action_needed" | "waiting" | "all">(
    "action_needed",
  );

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  // New communication form state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [channel, setChannel] = useState<CommunicationChannel>("email");
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [followUpDeadline, setFollowUpDeadline] = useState("");
  const [status, setStatus] = useState<CommunicationStatus>("needs_reply");

  // AI draft modal state
  const [draftCompany, setDraftCompany] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftContactName, setDraftContactName] = useState("");
  const [draftScenario, setDraftScenario] = useState<
    | "post_interview_thank_you"
    | "post_application_followup"
    | "status_inquiry"
    | "offer_response"
  >("post_interview_thank_you");
  const [draftNotes, setDraftNotes] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState<{
    subject: string;
    bodyText: string;
  } | null>(null);

  const { actionNeeded, waitingList, allList } = useMemo(() => {
    const act: Communication[] = [];
    const wait: Communication[] = [];
    for (const c of communications) {
      if (c.status === "needs_reply" || c.status === "follow_up_due") {
        act.push(c);
      } else {
        wait.push(c);
      }
    }
    return {
      actionNeeded: act,
      waitingList: wait,
      allList: communications,
    };
  }, [communications]);

  const displayedList =
    filter === "action_needed"
      ? actionNeeded
      : filter === "waiting"
        ? waitingList
        : allList;

  function openDraftModalFor(item?: Communication) {
    if (item) {
      setDraftCompany(item.company);
      setDraftRole(item.role);
      setDraftContactName(item.contact_name || "");
      if (item.status === "follow_up_due") {
        setDraftScenario("post_application_followup");
      } else {
        setDraftScenario("post_interview_thank_you");
      }
    } else if (savedJobs.length > 0) {
      setDraftCompany(savedJobs[0]?.company || "");
      setDraftRole(savedJobs[0]?.title || "");
      setDraftContactName("");
    }
    setGeneratedDraft(null);
    setIsDraftModalOpen(true);
  }

  function handleSelectSavedJob(jobId: string) {
    const job = savedJobs.find((j) => j.id === jobId);
    if (job) {
      setCompany(job.company || "");
      setRole(job.title || "");
    }
  }

  async function handleCreateCommunication(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !summary.trim()) return;
    setIsLogging(true);

    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          contact_name: contactName,
          contact_email: contactEmail,
          channel,
          direction,
          summary,
          occurred_at: occurredAt || new Date().toISOString(),
          follow_up_deadline: followUpDeadline || null,
          status,
        }),
      });

      const data = await res.json();
      if (data.success && data.communication) {
        setCommunications((prev) => [data.communication, ...prev]);
        setIsLogModalOpen(false);
        // Reset form
        setCompany("");
        setRole("");
        setContactName("");
        setContactEmail("");
        setSummary("");
        setFollowUpDeadline("");
      }
    } catch (err) {
      console.error("Failed to log communication", err);
    } finally {
      setIsLogging(false);
    }
  }

  async function handleUpdateStatus(
    id: string,
    nextStatus: CommunicationStatus,
  ) {
    try {
      const res = await fetch(`/api/communications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setCommunications((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)),
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this communication record?"))
      return;
    try {
      const res = await fetch(`/api/communications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCommunications((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }

  async function handleGenerateAiDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draftCompany.trim() || !draftRole.trim()) return;
    setIsDrafting(true);

    try {
      const res = await fetch("/api/communications/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: draftCompany,
          role: draftRole,
          contactName: draftContactName,
          scenario: draftScenario,
          notes: draftNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.draft) {
        setGeneratedDraft(data.draft);
      }
    } catch (err) {
      console.error("Failed to generate draft", err);
    } finally {
      setIsDrafting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-muted text-accent">
              <MailCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Follow-ups & Recruiter Tracker
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Never miss an employer email, track follow-up deadlines, and generate tailored recruiter replies with Gemini.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => openDraftModalFor()}
            className="btn btn-secondary rounded-full font-semibold"
          >
            <Bot className="mr-1.5 h-4 w-4 text-accent" />
            Draft AI Follow-up
          </Button>

          <Button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="btn btn-primary rounded-full font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Log Message
          </Button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter("action_needed")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "action_needed"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-accent" />
            Action Required ({actionNeeded.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("waiting")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "waiting"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Waiting on Employer ({waitingList.length})
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
            All Activity ({allList.length})
          </button>
        </div>
      </div>

      {/* Communications Feed */}
      {displayedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted text-accent">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-text-primary">
            {filter === "action_needed"
              ? "All caught up! No urgent follow-ups pending."
              : "No communication logs recorded yet."}
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-text-muted">
            Log an email from a recruiter or check-in deadline so you never forget to respond or follow up on an application.
          </p>
          <Button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="btn btn-primary btn-sm mt-5 rounded-full"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Log your first interaction
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedList.map((item) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
            const dateStr = formatDate(item.occurred_at);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:border-border-muted"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
                      {item.direction === "inbound" ? (
                        <Inbox className="h-5 w-5" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-text-primary">
                          {item.company}
                        </h3>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-sm font-semibold text-text-secondary">
                          {item.role}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span className="capitalize font-medium text-text-secondary">
                          {item.direction === "inbound"
                            ? "Received via"
                            : "Sent via"}{" "}
                          {item.channel}
                        </span>
                        <span>·</span>
                        <span>{dateStr}</span>
                        {item.contact_name && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-medium text-text-primary">
                              <User className="h-3 w-3" />
                              {item.contact_name}
                              {item.contact_email &&
                                ` (${item.contact_email})`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Draft Button for this item */}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openDraftModalFor(item)}
                    className="btn btn-secondary btn-sm rounded-full shrink-0 gap-1.5 font-semibold"
                  >
                    <Bot className="h-3.5 w-3.5 text-accent" />
                    Draft Follow-up
                  </Button>
                </div>

                {/* Summary / Message body note */}
                <div className="rounded-xl border border-border/70 bg-surface-secondary/40 p-3 text-xs leading-relaxed text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    Summary:{" "}
                  </span>
                  {item.summary}
                </div>

                {/* Follow-up deadline pill */}
                {item.follow_up_deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span>
                      Target follow-up date:{" "}
                      <strong className="text-text-primary">
                        {new Date(item.follow_up_deadline).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Bottom Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-muted">
                      Update status:
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          item.id,
                          e.target.value as CommunicationStatus,
                        )
                      }
                      className="rounded-lg border border-border bg-surface-secondary/60 px-2.5 py-1 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                    >
                      <option value="needs_reply">Needs Reply</option>
                      <option value="follow_up_due">Follow-up Due</option>
                      <option value="waiting">Waiting on Employer</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.contact_email && (
                      <a
                        href={`mailto:${item.contact_email}?subject=Following up: ${item.role} at ${item.company}`}
                        className="btn btn-secondary btn-sm rounded-full text-xs"
                      >
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        Open Email
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-text-muted hover:bg-error-light hover:text-error"
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

      {/* LOG COMMUNICATION MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-text-primary">
                Log Recruiter Communication
              </h2>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCommunication}
              className="mt-4 flex flex-col gap-4"
            >
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
                    placeholder="e.g. Stripe"
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
                    placeholder="e.g. Full-Stack Engineer"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Recruiter / Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. alex@stripe.com"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) =>
                      setChannel(e.target.value as CommunicationChannel)
                    }
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="phone">Phone / Call</option>
                    <option value="portal">Company Portal</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Direction
                  </label>
                  <select
                    value={direction}
                    onChange={(e) =>
                      setDirection(e.target.value as "inbound" | "outbound")
                    }
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="inbound">Received (Inbound)</option>
                    <option value="outbound">Sent (Outbound)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Current Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as CommunicationStatus)
                    }
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="needs_reply">Needs Reply</option>
                    <option value="follow_up_due">Follow-up Due</option>
                    <option value="waiting">Waiting on Employer</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Message Summary / Key Takeaway *
                </label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Recruiter asked for availability for a technical screen next week..."
                  className="rounded-xl border border-border bg-surface-secondary/40 p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Date of Communication (Optional)
                  </label>
                  <input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Follow-up Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDeadline}
                    onChange={(e) => setFollowUpDeadline(e.target.value)}
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLogModalOpen(false)}
                  className="btn btn-secondary btn-sm rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLogging}
                  className="btn btn-primary btn-sm rounded-full font-bold"
                >
                  {isLogging ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Log"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI FOLLOW-UP EMAIL DRAFT MODAL */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold text-text-primary">
                  Draft Follow-up Email with Gemini
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleGenerateAiDraft}
              className="mt-4 flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={draftCompany}
                    onChange={(e) => setDraftCompany(e.target.value)}
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
                    value={draftRole}
                    onChange={(e) => setDraftRole(e.target.value)}
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Recipient / Interviewer Name
                  </label>
                  <input
                    type="text"
                    value={draftContactName}
                    onChange={(e) => setDraftContactName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Email Purpose / Scenario
                  </label>
                  <select
                    value={draftScenario}
                    onChange={(e) =>
                      setDraftScenario(
                        e.target.value as
                          | "post_interview_thank_you"
                          | "post_application_followup"
                          | "status_inquiry"
                          | "offer_response",
                      )
                    }
                    className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="post_interview_thank_you">
                      Post-Interview Thank You Note
                    </option>
                    <option value="post_application_followup">
                      Post-Application Follow-Up (5–7 days after apply)
                    </option>
                    <option value="status_inquiry">
                      Decision Timeline Status Inquiry
                    </option>
                    <option value="offer_response">
                      Offer Next Steps Appreciation
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Specific Topics Discussed / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="e.g. We discussed scaling PostgreSQL and microservices, enjoyed talking with the team..."
                  className="rounded-xl border border-border bg-surface-secondary/40 p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isDrafting}
                className="btn btn-primary rounded-full font-bold"
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Writing Email with Gemini...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Generate Tailored Email Draft
                  </>
                )}
              </Button>
            </form>

            {/* Generated Draft Preview */}
            {generatedDraft && (
              <div className="mt-5 flex flex-col gap-3 rounded-xl border-2 border-accent/40 bg-surface-secondary/30 p-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold text-accent">
                    Generated Email Draft
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `Subject: ${generatedDraft.subject}\n\n${generatedDraft.bodyText}`,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-text-primary hover:bg-surface-secondary"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Draft
                        </>
                      )}
                    </button>

                    <a
                      href={`mailto:?subject=${encodeURIComponent(generatedDraft.subject)}&body=${encodeURIComponent(generatedDraft.bodyText)}`}
                      className="btn btn-primary btn-sm rounded-full text-xs font-semibold"
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Open in Email App
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Subject Line:
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-text-primary">
                    {generatedDraft.subject}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Body:
                  </span>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-text-secondary">
                    {generatedDraft.bodyText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
