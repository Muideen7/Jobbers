import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import { upsertUserProfile } from "@/lib/profile";
import type { Resume } from "@/types";

type ResumeDoc = Resume & {
  _id?: ObjectId | string;
};

function buildIdFilter(id: string): Filter<ResumeDoc> {
  const filters: Filter<ResumeDoc>[] = [{ id } as Filter<ResumeDoc>];
  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) } as Filter<ResumeDoc>);
  } else {
    filters.push({ _id: id } as Filter<ResumeDoc>);
  }
  return { $or: filters };
}

export async function listUserResumes(userId: string): Promise<Resume[]> {
  try {
    const collection = await getCollection<ResumeDoc>("resumes");
    const docs = await collection.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
    return docs.map((doc) => ({
      ...doc,
      id: doc.id || doc._id?.toString() || "",
    }));
  } catch (error) {
    console.error("[lib/resumes:listUserResumes]", error);
    return [];
  }
}

export async function getPrimaryResume(userId: string): Promise<Resume | null> {
  try {
    const collection = await getCollection<ResumeDoc>("resumes");
    const doc = (await collection.findOne({ user_id: userId, is_primary: true })) ??
      (await collection.findOne({ user_id: userId }));
    if (!doc) return null;
    return {
      ...doc,
      id: doc.id || doc._id?.toString() || "",
    };
  } catch (error) {
    console.error("[lib/resumes:getPrimaryResume]", error);
    return null;
  }
}

export async function createResume(
  params: Partial<Resume> & { user_id: string },
): Promise<Resume | null> {
  try {
    const collection = await getCollection<ResumeDoc>("resumes");
    const id = params.id || new ObjectId().toString();
    const now = new Date().toISOString();
    const doc: ResumeDoc = {
      id,
      user_id: params.user_id,
      name: params.name || "Untitled Resume",
      kind: params.kind || "uploaded",
      target_role: params.target_role ?? null,
      target_company: params.target_company ?? null,
      template: params.template ?? null,
      storage_path: params.storage_path ?? null,
      file_size: params.file_size ?? null,
      content: params.content ?? null,
      source_job_id: params.source_job_id ?? null,
      file_path: params.file_path ?? null,
      file_data: params.file_data ?? null,
      is_primary: Boolean(params.is_primary),
      created_at: params.created_at || now,
      updated_at: now,
    };
    await collection.insertOne(doc);
    return doc;
  } catch (error) {
    console.error("[lib/resumes:createResume]", error);
    return null;
  }
}

export async function updateResume(
  id: string,
  userId: string,
  updates: Partial<Resume>,
): Promise<Resume | null> {
  try {
    const collection = await getCollection<ResumeDoc>("resumes");
    const idFilter = buildIdFilter(id);
    await collection.updateOne(
      { ...idFilter, user_id: userId },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
    );
    const doc = await collection.findOne({ ...idFilter, user_id: userId });
    if (!doc) return null;
    return {
      ...doc,
      id: doc.id || doc._id?.toString() || id,
    };
  } catch (error) {
    console.error("[lib/resumes:updateResume]", error);
    return null;
  }
}

export async function setPrimaryResume(id: string, userId: string): Promise<boolean> {
  try {
    const resumesColl = await getCollection<ResumeDoc>("resumes");
    await resumesColl.updateMany({ user_id: userId }, { $set: { is_primary: false } });

    const idFilter = buildIdFilter(id);
    await resumesColl.updateOne(
      { ...idFilter, user_id: userId },
      { $set: { is_primary: true, updated_at: new Date().toISOString() } },
    );

    await upsertUserProfile(userId, { resume_pdf_url: "configured" });
    return true;
  } catch (error) {
    console.error("[lib/resumes:setPrimaryResume]", error);
    return false;
  }
}

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  try {
    const collection = await getCollection<ResumeDoc>("resumes");
    const idFilter = buildIdFilter(id);
    const result = await collection.deleteOne({ ...idFilter, user_id: userId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error("[lib/resumes:deleteResume]", error);
    return false;
  }
}