import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Building2,
  CircleHelp,
  Code2,
  Compass,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { cn } from "@/lib/utils";
import type { CompanyResearchDossier } from "@/types";

type Props = {
  company: string;
  jobId: string;
  research: CompanyResearchDossier | null;
  /**
   * When used inside the dashboard detail panel the wireframe Actions row owns
   * the research button, so the dossier hides its own.
   */
  showResearchButton?: boolean;
};

type Tone = "accent" | "info" | "success";

const TONE_CLASSES: Record<Tone, string> = {
  accent: "bg-accent-muted text-accent",
  info: "bg-info-lightest text-info-medium",
  success: "bg-success-lightest text-success",
};

function DossierCard({
  title,
  icon: Icon,
  tone = "accent",
  className,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold leading-5 text-text-primary">
          {title}
        </h3>
      </div>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-text-muted">
        Nothing recorded here yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm font-medium leading-6 text-text-primary">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Paragraph({ children }: { children: string }) {
  return (
    <p className="text-sm font-medium leading-6 text-text-primary">{children}</p>
  );
}

/** Exported so the job detail rail can surface candidate-fit cards above the fold. */
export function YourEdgeCard({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <DossierCard
      title="Your Edge"
      icon={ShieldCheck}
      tone="success"
      className={className}
    >
      <BulletList items={items} />
    </DossierCard>
  );
}

export function GapsToAddressCard({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <DossierCard title="Gaps to Address" icon={ListChecks} className={className}>
      <BulletList items={items} />
    </DossierCard>
  );
}

export function CompanyResearch({
  company,
  jobId,
  research,
  showResearchButton = true,
}: Props) {
  const hasResearch = research !== null;

  return (
    <div className="flex flex-col gap-5">
      {/* Dossier header — a plain label, so the sections below stay separate cards. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted">
            <Building2 className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-6 text-text-primary">
              Company Research
            </h2>
            <p className="text-xs text-text-muted">
              {company} · candidate-specific briefing
            </p>
          </div>
        </div>

        {!hasResearch && showResearchButton && (
          <ResearchCompanyButton jobId={jobId} />
        )}
      </div>

      {research ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DossierCard
            title="Company Overview"
            icon={Compass}
            className="sm:col-span-2"
          >
            <Paragraph>{research.companyOverview}</Paragraph>
          </DossierCard>

          <DossierCard title="Tech Stack" icon={Code2}>
            {research.techStack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {research.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No stack recorded.</p>
            )}
          </DossierCard>

          <DossierCard title="Culture" icon={Users} tone="info">
            <BulletList items={research.culture} />
          </DossierCard>

          <DossierCard title="Smart Questions" icon={CircleHelp} tone="info">
            <BulletList items={research.smartQuestions} />
          </DossierCard>

          <DossierCard
            title="Interview Prep"
            icon={MessageSquareText}
            tone="success"
          >
            <BulletList items={research.interviewPrep} />
          </DossierCard>

          <DossierCard
            title="Why This Role"
            icon={Lightbulb}
            tone="success"
            className="sm:col-span-2"
          >
            <Paragraph>{research.whyThisRole}</Paragraph>
          </DossierCard>

          {research.sources.length > 0 && (
            <DossierCard title="Sources" icon={Sparkles} className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {research.sources.map((source) => (
                  <Link
                    key={source}
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-full truncate rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {source}
                  </Link>
                ))}
              </div>
            </DossierCard>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
            <Building2 className="h-6 w-6 text-text-muted" />
          </div>
          <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
            No research yet
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
            Click &quot;Research Company&quot; to let the AI browse {company}
            &apos;s public pages and build a dossier.
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            Candidate-specific briefing
          </div>
          <div className="mt-4">
            {showResearchButton && <ResearchCompanyButton jobId={jobId} />}
          </div>
        </div>
      )}
    </div>
  );
}