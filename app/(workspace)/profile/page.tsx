export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { IdentityProfileClient } from "@/components/profile/IdentityProfileClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../../private-metadata";
import type { Profile } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Profile",
  "Your Jobbers profile — the master record used to score every role.",
);

export default async function ProfilePage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return <IdentityProfileClient profile={profile ?? null} />;
}