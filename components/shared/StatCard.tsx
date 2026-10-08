import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const PASTEL_CARD_BACKGROUNDS = [
  "bg-pastel-blue",
  "bg-pastel-mint",
  "bg-pastel-pink",
  "bg-pastel-lilac",
  "bg-pastel-cream",
  "bg-pastel-aqua",
] as const;

export function getPastelBg(index: number) {
  return PASTEL_CARD_BACKGROUNDS[index % PASTEL_CARD_BACKGROUNDS.length];
}

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  index?: number;
  className?: string;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  index = 0,
  className,
}: StatCardProps) {
  const bg = getPastelBg(index);

  return (
    <div
      className={cn(
        "rounded-[28px] border border-ink/[0.04] p-5 sm:p-6 transition-all",
        bg,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {title}
        </span>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg bg-surface/70 text-text-secondary",
            iconClassName,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl sm:text-3xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
    </div>
  );
}
