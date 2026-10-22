/**
 * Pure helpers for the /sitemap.xml route — kept DB-free so they can be
 * unit-tested without importing the Prisma client.
 */

/**
 * Returns true when `path` or any descendant (anything with the prefix
 * `${path}/`) is present in `pathsWithProducts`. Used to drop empty parent
 * categories from the sitemap.
 */
export function categoryHasProductsInSubtree(path: string, pathsWithProducts: Set<string>): boolean {
  if (pathsWithProducts.has(path)) return true;
  const prefix = `${path}/`;
  for (const p of pathsWithProducts) {
    if (p.startsWith(prefix)) return true;
  }
  return false;
}
