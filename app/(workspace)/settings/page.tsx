import type { Metadata } from "next";
import { Settings2, User, Bell, Shield, LogOut } from "lucide-react";

import { PostHogLogoutLink } from "@/components/analytics/PostHogLogoutLink";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../../private-metadata";
import type { Profile } from "@/types";
import Link from "next/link";

export const metadata: Metadata = privateMetadata(
  "Settings",
  "Manage your Jobbers account, notifications and preferences.",
);

export default async function SettingsPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("full_name, phone, location")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "full_name" | "phone" | "location">>();

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-12 pt-6 sm:px-6 lg:px-0">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings2 className="h-5 w-5 text-accent" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              Manage your account, notifications, and security.
            </p>
          </div>
        </div>

        {/* Account section */}
        <section className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <User className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Account</h2>
          </div>
          <div className="divide-y divide-border">
            <SettingRow
              label="Full name"
              value={profile?.full_name ?? "—"}
              hint="Used on your generated resume and application tracking."
              actionHref="/profile"
              actionLabel="Edit in Profile"
            />
            <SettingRow
              label="Email address"
              value={user.email ?? "—"}
              hint="Your sign-in email. Contact support to change it."
            />
            <SettingRow
              label="Phone number"
              value={profile?.phone ?? "—"}
              hint="Optional. Shown on your tailored resume PDF."
              actionHref="/profile"
              actionLabel="Edit in Profile"
            />
            <SettingRow
              label="Location"
              value={profile?.location ?? "—"}
              hint="Used for location-based job matching."
              actionHref="/profile"
              actionLabel="Edit in Profile"
            />
          </div>
        </section>

        {/* Notifications section */}
        <section className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <Bell className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-text-secondary leading-6">
              In-app notifications for completed agent runs and researched companies are always on. Email notifications are not yet available.
            </p>
            <span className="mt-3 inline-block rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-muted">
              Email notifications — coming soon
            </span>
          </div>
        </section>

        {/* Security section */}
        <section className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <Shield className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Security</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-text-secondary leading-6">
              Jobbers uses OAuth (Google / GitHub) for authentication — your password is managed by your identity provider, not stored here.
            </p>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-error/30 bg-surface shadow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-error/20 bg-error/5 px-6 py-4">
            <LogOut className="h-4 w-4 text-error" />
            <h2 className="text-sm font-semibold text-error">Sign out</h2>
          </div>
          <div className="flex items-center justify-between px-6 py-5">
            <p className="text-sm text-text-secondary">
              Sign out of your Jobbers account on this device.
            </p>
            <PostHogLogoutLink className="inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 hover:border-error/50">
              <LogOut className="h-4 w-4" />
              Sign out
            </PostHogLogoutLink>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  hint,
  actionHref,
  actionLabel,
}: {
  label: string;
  value: string;
  hint: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-text-primary truncate">{value}</p>
        <p className="mt-0.5 text-xs text-text-muted leading-5">{hint}</p>
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
