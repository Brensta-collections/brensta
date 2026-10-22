"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import { categoryFormSchema, type CategoryFormInput } from "@/lib/validators/category";
import type { PublishStatus, Prisma } from "@prisma/client";

export async function listAllCategories() {
  await assertAdmin();
  return prisma.category.findMany({
    orderBy: [{ path: "asc" }],
    include: {
      _count: { select: { children: true, products: true } },
    },
  });
}

export async function getCategoryForEdit(id: string) {
  await assertAdmin();
  return prisma.category.findUnique({ where: { id } });
}

function computePath(parentPath: string | null, slug: string) {
  return `${parentPath ?? ""}/${slug}`;
}

async function assertNoCycle(tx: Prisma.TransactionClient, id: string, newParentId: string | null) {
  if (!newParentId) return;
  let cur: string | null = newParentId;
  const seen = new Set<string>([id]);
  while (cur !== null) {
    const parentOfCur: string = cur;
    if (seen.has(parentOfCur)) throw new Error("Category parent would create a cycle.");
    seen.add(parentOfCur);
    const row = await tx.category.findUnique({ where: { id: parentOfCur }, select: { parentId: true } });
    cur = row ? row.parentId : null;
  }
}

export async function createCategory(input: CategoryFormInput) {
  await assertAdmin();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  let parent: { id: string; path: string; depth: number } | null = null;
  if (data.parentId) {
    parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { id: true, path: true, depth: true } });
    if (!parent) return { ok: false as const, error: "Parent not found." };
  }
  const path = computePath(parent?.path ?? null, data.slug);
  const dup = await prisma.category.findUnique({ where: { path } });
  if (dup) return { ok: false as const, error: "A category with this slug already exists under the same parent." };

  const created = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      path,
      depth: (parent?.depth ?? -1) + 1,
      description: data.description || null,
      image: data.image || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      status: data.status,
      showInMenu: data.showInMenu,
      sortOrder: data.sortOrder,
    },
  });
  await recordAudit({ action: "category.create", entityType: "Category", entityId: created.id, after: { path: created.path, status: created.status } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true as const, id: created.id };
}

export async function updateCategory(id: string, input: CategoryFormInput) {
  await assertAdmin();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Category not found." };

  // Guard against setting self as parent, or cycles
  if (data.parentId === id) return { ok: false as const, error: "A category cannot be its own parent." };

  const nextParentId = data.parentId || null;
  let nextParent: { id: string; path: string; depth: number } | null = null;
  if (nextParentId) {
    nextParent = await prisma.category.findUnique({ where: { id: nextParentId }, select: { id: true, path: true, depth: true } });
    if (!nextParent) return { ok: false as const, error: "Parent not found." };
    // reject descendant-as-parent (will be caught by assertNoCycle too)
    if (nextParent.path === existing.path || nextParent.path.startsWith(`${existing.path}/`)) {
      return { ok: false as const, error: "A category cannot be moved under its own descendant." };
    }
  }

  const newPath = computePath(nextParent?.path ?? null, data.slug);
  const newDepth = (nextParent?.depth ?? -1) + 1;

  try {
    await prisma.$transaction(async (tx) => {
      await assertNoCycle(tx, id, nextParentId);
      // Collision check: if any other row has the same path
      const collision = await tx.category.findFirst({ where: { path: newPath, NOT: { id } } });
      if (collision) throw new Error("DUP_SLUG");

      // Update this node
      await tx.category.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          parentId: nextParentId,
          path: newPath,
          depth: newDepth,
          description: data.description || null,
          image: data.image || null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          status: data.status,
          showInMenu: data.showInMenu,
          sortOrder: data.sortOrder,
        },
      });
      // Rewrite descendant paths + depths
      const descendants = await tx.category.findMany({
        where: { path: { startsWith: `${existing.path}/` } },
        select: { id: true, path: true, depth: true },
      });
      for (const d of descendants) {
        const relative = d.path.substring(existing.path.length); // starts with "/"
        const nextPath = `${newPath}${relative}`;
        const nextD = newDepth + (d.depth - existing.depth);
        await tx.category.update({ where: { id: d.id }, data: { path: nextPath, depth: nextD } });
      }
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "DUP_SLUG") return { ok: false as const, error: "Another category already uses this slug under the same parent." };
    if (msg.includes("cycle")) return { ok: false as const, error: msg };
    throw e;
  }

  await recordAudit({ action: "category.update", entityType: "Category", entityId: id, before: { path: existing.path, status: existing.status }, after: { path: newPath, status: data.status } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath(`/c${newPath}`);
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  await assertAdmin();
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!existing) return { ok: false as const, error: "Category not found." };
  if (existing._count.children > 0) return { ok: false as const, error: "Delete or move subcategories first." };
  if (existing._count.products > 0) return { ok: false as const, error: "Remove products from this category first." };

  await prisma.category.delete({ where: { id } });
  await recordAudit({ action: "category.delete", entityType: "Category", entityId: id, before: { path: existing.path } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true as const };
}

export async function setCategoryStatus(id: string, status: PublishStatus) {
  await assertAdmin();
  const before = await prisma.category.findUnique({ where: { id }, select: { status: true, path: true } });
  if (!before) return;
  await prisma.category.update({ where: { id }, data: { status } });
  await recordAudit({ action: `category.${status.toLowerCase()}`, entityType: "Category", entityId: id, before: { status: before.status }, after: { status } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function reorderCategory(id: string, dir: -1 | 1) {
  await assertAdmin();
  const row = await prisma.category.findUnique({ where: { id }, select: { parentId: true, sortOrder: true } });
  if (!row) return;
  const siblings = await prisma.category.findMany({
    where: { parentId: row.parentId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, sortOrder: true },
  });
  const idx = siblings.findIndex((s) => s.id === id);
  const swap = idx + dir;
  if (swap < 0 || swap >= siblings.length) return;
  const other = siblings[swap];
  await prisma.$transaction([
    prisma.category.update({ where: { id }, data: { sortOrder: other.sortOrder } }),
    prisma.category.update({ where: { id: other.id }, data: { sortOrder: row.sortOrder } }),
  ]);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
