"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import type { ReviewStatus } from "@prisma/client";

export async function listReviews(opts: { status?: ReviewStatus | "ALL"; page?: number }) {
  await assertAdmin();
  const where = opts.status && opts.status !== "ALL" ? { status: opts.status } : {};
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
}

export async function moderateReview(id: string, status: ReviewStatus, reason?: string) {
  await assertAdmin();
  const existing = await prisma.review.findUnique({ where: { id }, select: { status: true, productId: true } });
  if (!existing) return;
  await prisma.review.update({ where: { id }, data: { status, moderationReason: reason ?? null } });
  await recordAudit({ action: `review.${status.toLowerCase()}`, entityType: "Review", entityId: id, before: { status: existing.status }, after: { status, reason: reason ?? null } });
  revalidatePath("/admin/reviews");
  revalidatePath(`/p/${existing.productId}`);
}
