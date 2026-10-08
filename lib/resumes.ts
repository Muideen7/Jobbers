import "server-only";

import { createInsforgeServer } from "./insforge-server";
import type { Resume } from "@/types";

export async function listUserResumes(userId: string): Promise<Resume[]> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lib/resumes:listUserResumes]", error);
    return [];
  }
  return (data as Resume[]) ?? [];
}

export async function getPrimaryResume(userId: string): Promise<Resume | null> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle<Resume>();

  if (error) {
    console.error("[lib/resumes:getPrimaryResume]", error);
    return null;
  }
  return data;
}

export async function createResume(params: Partial<Resume> & { user_id: string }): Promise<Resume | null> {
  const insforge = await createInsforgeServer();
  const payload = [{ ...params }];
  const { data, error } = await insforge.database
    .from("resumes")
    .insert(payload)
    .select("*")
    .single<Resume>();

  if (error) {
    console.error("[lib/resumes:createResume]", error);
    return null;
  }
  return data;
}

export async function updateResume(id: string, userId: string, updates: Partial<Resume>): Promise<Resume | null> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("resumes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single<Resume>();

  if (error) {
    console.error("[lib/resumes:updateResume]", error);
    return null;
  }
  return data;
}

export async function setPrimaryResume(id: string, userId: string): Promise<boolean> {
  const insforge = await createInsforgeServer();
  // Clear existing primaries then set new one
  await insforge.database.from("resumes").update({ is_primary: false }).eq("user_id", userId);
  const { error } = await insforge.database
    .from("resumes")
    .update({ is_primary: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[lib/resumes:setPrimaryResume]", error);
    return false;
  }
  // Also sync profiles.resume_pdf_url if we have a storage_path
  const { data: resume } = await insforge.database
    .from("resumes")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<Pick<Resume, "storage_path">>();
  if (resume?.storage_path) {
    await insforge.database.from("profiles").update({ resume_pdf_url: resume.storage_path }).eq("id", userId);
  } else {
    await insforge.database.from("profiles").update({ resume_pdf_url: null }).eq("id", userId);
  }
  return true;
}

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  const insforge = await createInsforgeServer();
  const { error } = await insforge.database.from("resumes").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    console.error("[lib/resumes:deleteResume]", error);
    return false;
  }
  return true;
}