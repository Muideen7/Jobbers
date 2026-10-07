/**
 * Scraped postings (Arbeitnow, Adzuna, JSearch fallbacks) often drop raw HTML
 * into `about_role` — headings, paragraphs and lists. Rendered as text that
 * markup leaks straight into the UI ("<h1>Our Mission</h1>…"), which is what
 * the job detail page used to show.
 *
 * This module turns that markup into an ordered list of semantic blocks so the
 * detail page can render clean, styled content. Only text is ever extracted —
 * tags drive structure but are never emitted — so there is no XSS surface and
 * no sanitiser dependency. Kept free of React so `node --test` can cover it.
 */

export type JobDescriptionBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

const BLOCK_TAG_RE = /<(h[1-6]|p|div|ul|ol|li|br|section|article|blockquote)\b/i;

const TOKEN_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

const PARAGRAPH_TAGS = new Set([
  "p",
  "div",
  "section",
  "article",
  "blockquote",
]);

/** True when `value` carries markup rather than already-plain text. */
export function isHtmlContent(value: string | null | undefined): boolean {
  if (!value) return false;
  return BLOCK_TAG_RE.test(value);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&hellip;/gi, "…")
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&copy;/gi, "©")
    .replace(/&reg;/gi, "®")
    .replace(/&trade;/gi, "™")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    );
}

function normalize(value: string): string {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

/**
 * Splits a scraped HTML description into ordered blocks. Unknown inline tags
 * (a, strong, span, …) are ignored; their text is folded into the surrounding
 * block.
 */
export function parseJobDescriptionHtml(html: string): JobDescriptionBlock[] {
  const source = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const blocks: JobDescriptionBlock[] = [];
  let buffer: string[] = [];
  let itemBuffer: string[] = [];
  let listItems: string[] | null = null;

  const flushBlock = (): void => {
    const text = normalize(buffer.join(" "));
    if (text) blocks.push({ kind: "paragraph", text });
    buffer = [];
  };

  const flushHeading = (): void => {
    const text = normalize(buffer.join(" "));
    if (text) blocks.push({ kind: "heading", text });
    buffer = [];
  };

  const flushItem = (): void => {
    const text = normalize(itemBuffer.join(" "));
    if (text) {
      if (listItems === null) listItems = [];
      listItems.push(text);
    }
    itemBuffer = [];
  };

  const flushList = (): void => {
    flushItem();
    if (listItems && listItems.length > 0) {
      blocks.push({ kind: "list", items: listItems });
    }
    listItems = null;
    itemBuffer = [];
  };

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(source)) !== null) {
    const raw = source.slice(lastIndex, match.index);
    lastIndex = TOKEN_RE.lastIndex;

    if (raw) {
      if (listItems !== null) itemBuffer.push(raw);
      else buffer.push(raw);
    }

    const tag = (match[1] ?? "").toLowerCase();
    const closing = match[0][1] === "/";

    if (tag === "ul" || tag === "ol") {
      if (closing) flushList();
      else {
        flushBlock();
        listItems = [];
      }
      continue;
    }

    if (tag === "li") {
      if (closing) flushItem();
      continue;
    }

    if (tag === "br") {
      if (listItems !== null) itemBuffer.push(" ");
      else buffer.push(" ");
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      if (closing) flushHeading();
      continue;
    }

    if (PARAGRAPH_TAGS.has(tag)) {
      // A <p> nested inside an <li> (scrapers love this) stays part of the item.
      if (closing && listItems === null) flushBlock();
      continue;
    }
    // Inline/unknown tag — its text was already captured above.
  }

  flushList();
  flushBlock();

  return blocks;
}