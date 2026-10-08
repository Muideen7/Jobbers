import type { Metadata } from "next";

import { privateMetadata } from "../../../private-metadata";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { Resume } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Saved Resumes",
  "Your uploaded and generated resumes in one place.",
);

export default async function SavedResumesPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();
  const { data: resumes } = await insforge.database
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 pb-12 pt-6 sm:px-6 lg:px-0">
      <h1 className="text-3xl font-bold text-text-primary">Saved Resumes</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Uploaded and generated resumes live here.
      </p>
      <div className="mt-6 space-y-4">
        {(resumes as Resume[] ?? []).map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-text-primary">{r.name}</h2>
                <p className="text-xs text-text-muted">
                  {r.kind} · {r.template ?? "uploaded"} · {r.is_primary ? "Primary" : ""}
                </p>
              </div>
            </div>
          </div>
        ))}
        {(resumes?.length ?? 0) === 0 && (
          <p className="text-sm text-text-secondary">No saved resumes yet.</p>
        )}
      </div>
    </div>
  );
}