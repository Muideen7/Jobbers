"use client";

import { useEffect } from "react";
import { recordJobView } from "@/lib/recent-jobs";

export function RecordJobView({ jobId }: { jobId: string }) {
  useEffect(() => {
    if (jobId) {
      recordJobView(jobId);
    }
  }, [jobId]);

  return null;
}
