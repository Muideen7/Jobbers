import { JobbersIcon } from "@/components/homepage/Logos";

export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 bg-background animate-page-enter">
      <div className="relative flex items-center justify-center">
        {/* Subtle breathing glow */}
        <div className="absolute w-16 h-16 rounded-full bg-accent/15 blur-xl animate-pulse" />

        {/* Brand Icon with gentle spin */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-surface border border-border shadow-xs text-text-primary">
          <JobbersIcon className="w-6 h-6 animate-spin [animation-duration:3s]" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-text-secondary tracking-wide">
        <span>Loading</span>
        <span className="inline-flex">
          <span className="animate-bounce [animation-delay:0ms]">.</span>
          <span className="animate-bounce [animation-delay:150ms]">.</span>
          <span className="animate-bounce [animation-delay:300ms]">.</span>
        </span>
      </div>
    </div>
  );
}
