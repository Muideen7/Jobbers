"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  CheckCircle2,
  CircleDashed,
  Copy,
  ExternalLink,
  Laptop,
  Mail,
  Download,
  Briefcase,
  ShieldCheck,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { IntegrationsState } from "@/types";
import {
  togglePipelineAutoSyncAction,
  disconnectIntegrationAction,
  markGoogleCalendarSubscribedAction,
} from "@/actions/integrations";

type Props = {
  interviewCount: number;
  trackedInterviewRolesCount: number;
  appliedRolesCount: number;
  feedUrl: string;
  initialIntegrations: IntegrationsState;
};

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IntegrationsClient({
  interviewCount,
  trackedInterviewRolesCount,
  appliedRolesCount,
  feedUrl,
  initialIntegrations,
}: Props) {
  const [integrations, setIntegrations] =
    useState<IntegrationsState>(initialIntegrations);
  const [copied, setCopied] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Webcal protocol for 1-click direct calendar app opening
  const webcalUrl = feedUrl.replace(/^https?:\/\//i, "webcal://");

  function handleCopyFeed() {
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleLaunchGoogleCalendar() {
    const gcalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
      webcalUrl,
    )}`;
    window.open(gcalUrl, "_blank", "noopener,noreferrer");
    setShowGooglePrompt(true);
  }

  function handleMarkGoogleSubscribed() {
    startTransition(async () => {
      const res = await markGoogleCalendarSubscribedAction();
      if (res.success) {
        setIntegrations((prev) => ({
          ...prev,
          googleCalendar: {
            ...prev.googleCalendar,
            connected: true,
            lastSyncedAt: new Date().toISOString(),
          },
        }));
        setShowGooglePrompt(false);
      }
    });
  }

  function handleDisconnectGoogle() {
    startTransition(async () => {
      const res = await disconnectIntegrationAction("google_calendar");
      if (res.success) {
        setIntegrations((prev) => ({
          ...prev,
          googleCalendar: {
            ...prev.googleCalendar,
            connected: false,
            lastSyncedAt: null,
            accountEmail: null,
          },
        }));
        setShowGooglePrompt(false);
      }
    });
  }

  function handleDisconnectIcal() {
    startTransition(async () => {
      const res = await disconnectIntegrationAction("ical_feed");
      if (res.success) {
        setIntegrations((prev) => ({
          ...prev,
          icalFeed: {
            ...prev.icalFeed,
            connected: false,
            syncCount: 0,
            lastSyncedAt: null,
            clientName: null,
          },
        }));
      }
    });
  }

  function handleTogglePipelineSync() {
    const nextState = !integrations.pipelineSync.enabled;
    // Optimistic update
    setIntegrations((prev) => ({
      ...prev,
      pipelineSync: {
        ...prev.pipelineSync,
        enabled: nextState,
      },
    }));

    startTransition(async () => {
      const res = await togglePipelineAutoSyncAction(nextState);
      if (!res.success) {
        // Rollback
        setIntegrations((prev) => ({
          ...prev,
          pipelineSync: {
            ...prev.pipelineSync,
            enabled: !nextState,
          },
        }));
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sync upcoming job interviews with your favorite calendars and keep your application pipeline updated automatically.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
          <Link href="/interviews" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-accent" />
            <span>Go to Interviews</span>
          </Link>
        </Button>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Google Calendar Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Google Calendar
                  </h3>
                  <p className="text-xs text-text-muted">
                    Web subscription & 1-click event sync
                  </p>
                </div>
              </div>

              {integrations.googleCalendar.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                  <CircleDashed className="h-3 w-3" />
                  Not Connected
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              Subscribe once or launch direct Google Calendar events for any interview round. Supports meeting links, interviewer info, and reminder notifications.
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">
                  Default Event Reminder
                </span>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">
                  Scheduled Interviews Synced
                </span>
                <span className="font-semibold text-accent">
                  {interviewCount} {interviewCount === 1 ? "round" : "rounds"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-border/60 pt-2.5">
                <span className="font-medium text-text-secondary">
                  Connection Status
                </span>
                <span className="font-medium text-text-primary">
                  {integrations.googleCalendar.connected
                    ? `Active (${formatRelativeTime(integrations.googleCalendar.lastSyncedAt)})`
                    : "Not linked"}
                </span>
              </div>
            </div>

            {/* Prompt when opening Google Calendar web subscription */}
            {showGooglePrompt && !integrations.googleCalendar.connected && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-muted/30 p-3 text-xs">
                <span className="text-text-primary">
                  Did you add the calendar in Google Calendar?
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleMarkGoogleSubscribed}
                  disabled={isPending}
                  className="rounded-lg text-xs font-semibold shrink-0"
                >
                  Confirm Connected
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleLaunchGoogleCalendar}
                size="sm"
                className="rounded-xl font-semibold text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Subscribe in Google Calendar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyFeed}
                className="rounded-xl text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-success" />
                    Feed Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy iCal URL
                  </>
                )}
              </Button>
            </div>

            {integrations.googleCalendar.connected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnectGoogle}
                disabled={isPending}
                className="rounded-xl text-xs text-text-muted hover:text-danger hover:bg-danger/10"
              >
                <Unlink className="h-3.5 w-3.5 mr-1" />
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Apple Calendar & Outlook Card (Live Feed) */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-text-primary">
                  <Laptop className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Apple Calendar & Outlook
                  </h3>
                  <p className="text-xs text-text-muted">
                    Live RFC 5545 iCalendar (`.ics`) subscription
                  </p>
                </div>
              </div>

              {integrations.icalFeed.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                  <CircleDashed className="h-3 w-3" />
                  Not Subscribed
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              Add your private Jobbers calendar subscription into Apple Calendar (macOS & iOS), Microsoft Outlook, or Thunderbird. Any changes you make on Jobbers sync automatically.
            </p>

            {/* Sync Activity Metadata */}
            <div className="mt-5 space-y-2.5 rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-secondary">Last Sync</span>
                <span className="font-medium text-text-primary">
                  {formatRelativeTime(integrations.icalFeed.lastSyncedAt)}
                  {integrations.icalFeed.clientName && (
                    <span className="text-text-muted ml-1">
                      via {integrations.icalFeed.clientName}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="font-medium text-text-secondary">Sync Requests</span>
                <span className="font-medium text-text-primary">
                  {integrations.icalFeed.syncCount}{" "}
                  {integrations.icalFeed.syncCount === 1 ? "fetch" : "fetches"}
                </span>
              </div>
            </div>

            {/* Subscription URL Box */}
            <div className="mt-4 rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Private Calendar Feed URL
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={feedUrl}
                  className="flex-1 truncate rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-mono text-text-secondary select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFeed}
                  className="shrink-0 rounded-lg text-xs"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl font-semibold text-xs"
              >
                <a href={webcalUrl}>
                  <Laptop className="h-3.5 w-3.5 mr-1.5" />
                  Open with Calendar App
                </a>
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="rounded-xl text-xs text-text-secondary hover:text-text-primary"
              >
                <a href={feedUrl} download="jobbers-interviews.ics">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download .ics
                </a>
              </Button>
            </div>

            {integrations.icalFeed.connected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnectIcal}
                disabled={isPending}
                className="rounded-xl text-xs text-text-muted hover:text-danger hover:bg-danger/10"
              >
                <Unlink className="h-3.5 w-3.5 mr-1" />
                Reset Feed
              </Button>
            )}
          </div>
        </div>

        {/* Application Pipeline Stage Auto-Sync */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Application Pipeline Auto-Sync
                  </h3>
                  <p className="text-xs text-text-muted">
                    Bidirectional link between tracked jobs & interviews
                  </p>
                </div>
              </div>

              {integrations.pipelineSync.enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                  <CircleDashed className="h-3 w-3" />
                  Disabled
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              When you schedule an interview for a tracked job, Jobbers automatically advances the role in your pipeline to the <strong>Interview</strong> stage. When an interview is completed, status and outcomes are tracked effortlessly.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                  Tracked in Interview Stage
                </span>
                <p className="mt-1 text-lg font-bold text-text-primary">
                  {trackedInterviewRolesCount} {trackedInterviewRolesCount === 1 ? "role" : "roles"}
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                  Active Applications
                </span>
                <p className="mt-1 text-lg font-bold text-text-primary">
                  {appliedRolesCount} {appliedRolesCount === 1 ? "role" : "roles"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs font-medium text-text-secondary">
              Auto-advance stage when interview scheduled
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={integrations.pipelineSync.enabled}
                onChange={handleTogglePipelineSync}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-accent peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        </div>

        {/* Email & Recruiter Communications */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Recruiter Follow-up & Email
                  </h3>
                  <p className="text-xs text-text-muted">
                    Deadlines, status checks & AI email drafts
                  </p>
                </div>
              </div>

              {integrations.emailService.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  {integrations.emailService.isVerified ? "Verified" : "Connected"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                  <CircleDashed className="h-3 w-3" />
                  Not Linked
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              Keep recruiter email threads, response deadlines, and status checks organized. One-click follow-up draft generation with native <code>mailto:</code> launcher.
            </p>

            <div className="mt-5 space-y-2 rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-secondary">Connected Email</span>
                <span className="font-semibold text-text-primary">
                  {integrations.emailService.email || "No email linked"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="font-medium text-text-secondary">Account Security</span>
                <span className="flex items-center gap-1 text-success font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {integrations.emailService.isVerified ? "Email verified" : "Active session"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end border-t border-border pt-4">
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
              <Link href="/follow-ups">
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Open Follow-ups
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Setup Instructions Accordion */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          How to Subscribe to Jobbers Calendar in 30 Seconds
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-surface-secondary/30 p-4">
            <p className="text-xs font-bold text-text-primary">1. Google Calendar</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Click &quot;Subscribe in Google Calendar&quot; above, or in Google Calendar on web, click the <strong>+</strong> next to &quot;Other calendars&quot; &rarr; <strong>From URL</strong>, and paste your iCal URL.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-secondary/30 p-4">
            <p className="text-xs font-bold text-text-primary">2. Apple Calendar (iPhone / Mac)</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              On Mac, open Calendar &rarr; <strong>File &gt; New Calendar Subscription</strong>, paste your feed URL. On iPhone, go to <strong>Settings &gt; Calendar &gt; Accounts &gt; Add Subscribed Calendar</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-secondary/30 p-4">
            <p className="text-xs font-bold text-text-primary">3. Microsoft Outlook</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              In Outlook Calendar, select <strong>Add Calendar</strong> &rarr; <strong>Subscribe from web</strong>, paste your feed URL and name it &quot;Jobbers Interviews&quot;.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
