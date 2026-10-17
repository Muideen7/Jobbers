import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { parseJobSearch } from "@/lib/search-query";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Filter } from "mongodb";
import type { Job } from "@/types";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = req.nextUrl;
    const search = parseJobSearch(searchParams.get("search"));
    const matchFilter = searchParams.get("matchFilter") ?? "all";
    const sortOption = searchParams.get("sortOption") ?? "score";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const limitParam = parseInt(searchParams.get("limit") ?? "", 10);
    const pageSize = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : PAGE_SIZE;

    const query: Filter<Job> = { user_id: user.id };

    if (matchFilter === "high") {
      query.match_score = { $gte: MATCH_THRESHOLD } as unknown as number;
    } else if (matchFilter === "low") {
      query.match_score = { $lt: MATCH_THRESHOLD } as unknown as number;
    }

    if (search) {
      const regex = { $regex: search, $options: "i" } as unknown as string;
      query.$or = [{ title: regex }, { company: regex }];
    }

    const sortOrder: Record<string, 1 | -1> =
      sortOption === "score"
        ? { match_score: -1, found_at: -1 }
        : sortOption === "oldest"
          ? { found_at: 1 }
          : { found_at: -1 };

    const skip = (page - 1) * pageSize;
    const jobsCollection = await getCollection<Job>("jobs");

    const [data, totalCount] = await Promise.all([
      jobsCollection.find(query).sort(sortOrder).skip(skip).limit(pageSize).toArray(),
      jobsCollection.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs: (data as Job[] | null) ?? [],
        totalCount,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("[api/jobs]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
