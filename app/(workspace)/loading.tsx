export default function WorkspaceLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 animate-page-enter" aria-label="Loading workspace">
      {/* Top Breadcrumb & Actions Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded-md bg-surface-secondary animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-surface-secondary/70 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 rounded-lg bg-surface-secondary animate-pulse" />
          <div className="h-9 w-32 rounded-lg bg-surface-secondary animate-pulse" />
        </div>
      </div>

      {/* Metric / Stat Card Skeleton Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[28px] border border-border bg-surface p-5 sm:p-6 shadow-xs flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-surface-secondary animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-surface-secondary animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-16 rounded-md bg-surface-secondary animate-pulse" />
              <div className="h-3 w-28 rounded bg-surface-secondary/70 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border-light pb-4">
          <div className="h-5 w-40 rounded bg-surface-secondary animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-surface-secondary animate-pulse" />
        </div>

        {/* Skeleton Rows */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl border border-border-light bg-surface-secondary/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-surface-secondary animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-48 rounded bg-surface-secondary animate-pulse" />
                  <div className="h-3 w-32 rounded bg-surface-secondary/70 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 rounded-full bg-surface-secondary animate-pulse hidden sm:block" />
                <div className="h-8 w-24 rounded-lg bg-surface-secondary animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
