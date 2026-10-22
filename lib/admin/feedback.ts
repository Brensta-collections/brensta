"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import type { FeedbackStatus } from "@prisma/client";

export async function listFeedback(opts: { status?: FeedbackStatus | "ALL"; page?: number }) {
  await assertAdmin();
  const where = opts.status && opts.status !== "ALL" ? { status: opts.status } : {};
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const [items, total] = await Promise.all([
    prisma.feedbackMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.feedbackMessage.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
}

export async function updateFeedback(id: string, status: FeedbackStatus, reply?: string) {
  await assertAdmin();
  const existing = await prisma.feedbackMessage.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return;
  await prisma.feedbackMessage.update({
    where: { id },
    data: { status, reply: reply ?? undefined, repliedAt: reply ? new Date() : undefined },
  });
  await recordAudit({ action: `feedback.${status.toLowerCase()}`, entityType: "FeedbackMessage", entityId: id, before: { status: existing.status }, after: { status } });
  revalidatePath("/admin/feedback");
}
