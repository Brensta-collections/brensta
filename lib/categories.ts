import { prisma } from "@/lib/db";

export type CategoryWithChildren = Awaited<ReturnType<typeof getMainCategoriesWithChildren>>[number];

export async function getMainCategoriesWithChildren() {
  return prisma.category.findMany({
    where: { parentId: null, status: "PUBLISHED", showInMenu: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { status: "PUBLISHED", showInMenu: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
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
