import type { SourceCredit } from "@/lib/source-attribution";

type Props = {
  credits: SourceCredit[];
  className?: string;
};

/**
 * "Jobs via JSearch · RemoteOK · …" link-back line required by the job
 * source APIs' terms (plan A7). Renders nothing when there is nothing to
 * credit — e.g. only hand-saved URL jobs on the page.
 */
export function SourceCredits({ credits, className }: Props) {
  if (credits.length === 0) {
    return null;
  }

  return (
    <p className={`text-center text-xs text-text-muted ${className ?? ""}`}>
      Jobs via{" "}
      {credits.map((credit, index) => (
        <span key={credit.label}>
          {index > 0 && (index === credits.length - 1 ? " and " : " · ")}
          <a
            href={credit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-text-secondary"
          >
            {credit.label}
          </a>
        </span>
      ))}
    </p>
  );
}
