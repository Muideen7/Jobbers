"use client";

import { ChevronDown, Globe } from "lucide-react";
import { JOB_BOARDS } from "@/lib/job-boards";

type Props = {
  value: string;
  onChange: (boardId: string) => void;
  className?: string;
  showAllOption?: boolean;
};

export function JobBoardSelect({
  value,
  onChange,
  className = "",
  showAllOption = true,
}: Props) {
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter by job board"
        className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-8.5 pr-8 text-xs font-medium text-text-primary cursor-pointer transition-colors hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {showAllOption && (
          <option value="all">
            All Job Boards
          </option>
        )}
        {JOB_BOARDS.map((board) => (
          <option key={board.id} value={board.id}>
            {board.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
    </div>
  );
}
