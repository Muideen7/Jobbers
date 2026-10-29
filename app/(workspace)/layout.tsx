export const dynamic = "force-dynamic";

import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Profile } from "@/types";

/**
 * Shared chrome for every authenticated workspace page — the collapsible
 * AppShell sidebar and top bar. Pages below this layout only
 * render their content; auth and the profile-driven nav identity live here.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const profile = await (await getCollection<Profile>('profiles')).findOne({ id: user.id });

  return (
    <>
      {/* Suspense keeps AppShell's useSearchParams safe on statically
          prerenderable descendants. */}
      <Suspense>
        <AppShell
          user={{
            name: profile?.full_name || user.name || null,
            email: profile?.email || user.email || null,
            image: user.image || profile?.image || null,
          }}
        >
          {children}
        </AppShell>
      </Suspense>
    </>
  );
}