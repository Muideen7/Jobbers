import type { MissingField, Profile } from "@/types";

type Props = {
  completionPercent: number;
  missingFields: MissingField[];
  profile: Profile | null;
};

/**
 * Top card of the profile home (plan D1, "overview + sections" layout):
 * completion ring + status line + missing-field chips + at-a-glance stats.
 * Always visible — unlike `ProfileAttentionBanner` (dashboard), which hides
 * at 100%. Server component; shares the banner's ring and chip styling so the
 * two never read as different design systems.
 */
export function ProfileOverview({
  completionPercent,
  missingFields,
  profile,
}: Props) {
  const isComplete = completionPercent === 100;

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (completionPercent / 100) * circumference;

  const skills = profile?.skills ?? [];
  const roles = profile?.job_titles_seeking ?? [];
  const experienceEntries = (profile?.work_experience ?? []).filter(
    (entry) => entry.company || entry.title,
  );
  const years = profile?.years_experience;

  const stats = [
    { label: "Skills", value: String(skills.length) },
    { label: "Roles", value: String(roles.length) },
    { label: "Experience", value: String(experienceEntries.length) },
    { label: "Years", value: years != null ? String(years) : "—" },
  ];

  return (
    <section className="flex items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-text-primary">
          Profile overview
        </h2>
        <p
          className={`mt-0.5 text-sm ${
            isComplete ? "text-success" : "text-text-secondary"
          }`}
        >
          {isComplete
            ? "Every field is filled in — scoring, highlights and auto-apply all read from here."
            : "Job scoring and auto-apply read from here. Complete the fields below for the best match quality."}
        </p>

        {!isComplete && missingFields.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <span
                key={field}
                className="rounded-sm bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground"
              >
                {field}
              </span>
            ))}
          </div>
        )}

        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs font-medium text-text-muted">
                {stat.label}
              </dt>
              <dd className="mt-0.5 text-3xl font-semibold text-text-primary">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className="relative flex-shrink-0"
        style={{ width: 88, height: 88 }}
      >
        <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold leading-none text-text-primary">
            {completionPercent}%
          </span>
        </div>
      </div>
    </section>
  );
}
