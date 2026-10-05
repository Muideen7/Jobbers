const FORBIDDEN = /[,()"\\%*]/g;
const WHITESPACE_RUN = /\s+/g;
const MAX_LENGTH = 80;

/**
 * Sanitises a user-supplied job search term before it is interpolated into a
 * PostgREST `or=` filter.
 *
 * Two separate grammar rules are in play. PostgREST treats `,` `(` `)` `"` and
 * `\` as structural characters of the `or=(...)` expression, so leaving them in
 * lets a query string inject extra predicates and rewrite the filter's shape.
 * `ilike` independently treats `%` and `*` as wildcards, so a bare `%` widens
 * the term to "match every row".
 *
 * Stripped characters become spaces and the result is whitespace-collapsed, so
 * `sales, marketing` normalises to `sales marketing` rather than picking up the
 * double space a naive per-character replace would leave behind.
 */
export function parseJobSearch(raw: string | null | undefined): string {
  return (raw ?? "")
    .replace(FORBIDDEN, " ")
    .replace(WHITESPACE_RUN, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_LENGTH);
}