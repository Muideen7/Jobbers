import { FileText, ListChecks } from "lucide-react";
import Link from "next/link";

import {
  isHtmlContent,
  parseJobDescriptionHtml,
  type JobDescriptionBlock,
} from "@/lib/job-description";

type Props = {
  aboutRole: string | null;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  sourceUrl: string | null;
};

type BulletSection = {
  title: string;
  items: string[];
};

function isTruncatedPreview(description: string | null): boolean {
  if (!description) return false;

  const trimmed = description.trim();
  return trimmed.endsWith("…") || trimmed.endsWith("...");
}

function BulletList({ section }: { section: BulletSection }) {
  if (section.items.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold leading-5 text-text-primary">
        {section.title}
      </h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium leading-6 text-text-primary">
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** Renders scraped HTML as clean, styled blocks instead of leaking raw markup. */
function RichDescription({ blocks }: { blocks: JobDescriptionBlock[] }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h3
              key={index}
              className="mt-2 text-base font-semibold leading-6 text-text-primary first:mt-0"
            >
              {block.text}
            </h3>
          );
        }

        if (block.kind === "list") {
          return (
            <ul
              key={index}
              className="list-disc space-y-2 pl-5 text-sm font-medium leading-6 text-text-primary"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={index}
            className="text-sm font-medium leading-6 text-text-primary"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export function JobDescription({
  aboutRole,
  responsibilities,
  requirements,
  niceToHave,
  benefits,
  sourceUrl,
}: Props) {
  const hasHtml = isHtmlContent(aboutRole);
  const blocks = hasHtml && aboutRole ? parseJobDescriptionHtml(aboutRole) : [];
  const shouldShowFullPostLink =
    !hasHtml && isTruncatedPreview(aboutRole) && Boolean(sourceUrl);

  const sections: BulletSection[] = [
    { title: "Responsibilities", items: responsibilities },
    { title: "Requirements", items: requirements },
    { title: "Nice to Have", items: niceToHave },
    { title: "Benefits", items: benefits },
  ].filter((section) => section.items.length > 0);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted">
          <FileText className="h-4 w-4 text-accent" />
        </span>
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Job Description
        </h2>
      </div>

      <div className="mt-5">
        {blocks.length > 0 ? (
          <RichDescription blocks={blocks} />
        ) : aboutRole ? (
          <p className="text-sm font-medium leading-6 text-text-primary">
            {aboutRole}
          </p>
        ) : (
          <p className="text-sm font-medium leading-6 text-text-muted">
            No description was provided for this role.
          </p>
        )}
      </div>

      {sections.map((section) => (
        <BulletList key={section.title} section={section} />
      ))}

      {shouldShowFullPostLink && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs font-medium leading-5 text-text-secondary">
            <ListChecks className="h-4 w-4 shrink-0 text-text-muted" />
            This listing was cut short by the source.
          </p>
          <Link
            href={sourceUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm shrink-0"
          >
            View full post
          </Link>
        </div>
      )}
    </section>
  );
}