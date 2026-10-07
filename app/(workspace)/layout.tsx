import { Suspense, type ReactNode } from "react";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { Profile } from "@/types";

/**
 * Shared chrome for every authenticated workspace page — the collapsible
 * AppShell sidebar, top bar and PostHog identity. Pages below this layout only
 * render their content; auth and the profile-driven nav identity live here.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <>
      <PostHogIdentify userId={user.id} />
      {/* Suspense keeps AppShell's useSearchParams safe on statically
          prerenderable descendants. */}
      <Suspense>
        <AppShell
          user={{
            name: profile?.full_name ?? null,
            email: profile?.email ?? null,
          }}
        >
          {children}
        </AppShell>
      </Suspense>
    </>
  );
}