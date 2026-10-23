/**
 * Pure helpers for the storefront search query. Kept DB-free so unit tests
 * can run without a Postgres connection; integration tests cover the end-
 * to-end wiring in listProducts.
 *
 * The storefront runs Prisma's `contains` operator which Prisma compiles to
 * Postgres `ILIKE '%<input>%'` with no automatic escape. If the user types
 * `%`, `_` or `\` those must be rendered literal before Postgres sees them —
 * otherwise `%` matches any sequence, `_` matches any single char, and a
 * dangling `\` can produce an ILIKE pattern error.
 */

/**
 * Escape %, _ and \ so Prisma's `contains` treats them literally in Postgres
 * ILIKE. Backslashes are doubled FIRST so the escape chars we insert aren't
 * themselves escaped on a second pass.
 */
export function escapeLikeMetachars(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

/**
 * Build the de-duplicated substring patterns to search with:
 *   - the trimmed input itself
 *   - plus, if it ends with a lowercase "s" and the trimmed length is at
 *     least 2, the version without the trailing "s"
 *
 * Returned strings are NOT escaped — callers run each through
 * `escapeLikeMetachars` before Prisma. We only strip trailing "s"; -ies /
 * -es stemming without a real stemmer risks false matches and is out of
 * scope for this phase.
 */
export function buildSearchStems(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const stems = [trimmed];
  if (trimmed.length >= 2 && trimmed.endsWith("s")) {
    const stripped = trimmed.slice(0, -1);
    if (stripped && !stems.includes(stripped)) stems.push(stripped);
  }
  return stems;
}
