import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import type { MissingField } from "@/types";

type Props = {
  completionPercent: number;
  missingFields: MissingField[];
};

export function ProfileAttentionBanner({
  completionPercent,
  missingFields,
}: Props) {
  if (completionPercent === 100) return null;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (completionPercent / 100) * circumference;

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning mt-0.5">
          <AlertCircle className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              Profile Setup: {completionPercent}% Complete
            </h2>
          </div>

          <p className="mt-0.5 text-xs text-text-secondary">
            Fill missing fields to improve AI scoring and resume personalization accuracy.
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {missingFields.slice(0, 4).map((field) => (
              <span
                key={field}
                className="rounded-md bg-surface-secondary border border-border/60 px-2 py-0.5 text-[11px] font-medium text-text-secondary"
              >
                {field}
              </span>
            ))}
            {missingFields.length > 4 && (
              <span className="text-[11px] text-text-muted">
                +{missingFields.length - 4} more
              </span>
            )}

            <Link
              href="/profile"
              className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Finish setup
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
          <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
            <circle
              cx="34"
              cy="34"
              r={radius}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="6"
            />
            <circle
              cx="34"
              cy="34"
              r={radius}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 34 34)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold leading-none text-text-primary">
              {completionPercent}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

