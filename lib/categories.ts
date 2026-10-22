import { prisma } from "@/lib/db";

export type CategoryWithChildren = Awaited<ReturnType<typeof getMainCategoriesWithChildren>>[number];

/**
 * Return top-level published categories for the storefront nav, trimming:
 *  - subcategories that have zero published products (unless they themselves have grandchildren)
 *  - top-level categories that have no reachable published products at all
 *
 * We never delete; we just hide. Admin keeps full control via the admin tree.
 */
export async function getMainCategoriesWithChildren() {
  const roots = await prisma.category.findMany({
    where: { parentId: null, status: "PUBLISHED", showInMenu: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { status: "PUBLISHED", showInMenu: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true, children: true } },
          // One extra level so the mega menu can offer 2-level navigation
          // (e.g. Jewellery > Earrings > Studs). Deeper trees are still
          // reachable from the category landing page's chip list.
          children: {
            where: { status: "PUBLISHED", showInMenu: true },
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { products: true, children: true } },
            },
          },
        },
      },
      _count: { select: { products: true, children: true } },
    },
  });
  // Pull product counts for every root (including descendants) so we can hide empty roots.
  const descendantCountByRoot = new Map<string, number>();
  for (const r of roots) {
    const n = await prisma.product.count({
      where: {
        status: "PUBLISHED",
        categories: {
          some: {
            category: {
              OR: [{ path: r.path }, { path: { startsWith: `${r.path}/` } }],
            },
          },
        },
      },
    });
    descendantCountByRoot.set(r.id, n);
  }
  return roots
    .filter((r) => (descendantCountByRoot.get(r.id) ?? 0) > 0)
    .map((r) => ({
      ...r,
      children: r.children
        .filter((c) => c._count.products > 0 || c._count.children > 0)
        .map((c) => ({
          ...c,
          // Hide grandchildren that have neither products nor great-grandchildren.
          children: c.children.filter((gc) => gc._count.products > 0 || gc._count.children > 0),
        })),
    }));
}

export async function getCategoryByPath(path: string) {
  return prisma.category.findUnique({
    where: { path },
    include: {
      parent: true,
      children: { where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } },
      attributes: {
        include: { attribute: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getBreadcrumbs(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return [];
  const paths: string[] = [];
  let acc = "";
  for (const p of parts) {
    acc += `/${p}`;
    paths.push(acc);
  }
  const cats = await prisma.category.findMany({
    where: { path: { in: paths } },
    select: { name: true, path: true },
  });
  const byPath = new Map(cats.map((c) => [c.path, c]));
  return paths.map((p) => byPath.get(p)).filter(Boolean) as Array<{ name: string; path: string }>;
}

/**
 * Collect this category's id and all descendant ids by matching path prefix.
 * Used so a category page shows products from all its sub-categories.
 */
export async function getCategoryAndDescendantIds(path: string): Promise<string[]> {
  const rows = await prisma.category.findMany({
    where: {
      OR: [{ path }, { path: { startsWith: `${path}/` } }],
      status: "PUBLISHED",
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
