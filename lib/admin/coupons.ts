"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import { couponFormSchema, type CouponFormInput } from "@/lib/validators/coupon";
import { Prisma } from "@prisma/client";

export async function listCoupons() {
  await assertAdmin();
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
}

export async function getCouponForEdit(id: string) {
  await assertAdmin();
  return prisma.coupon.findUnique({ where: { id } });
}

export async function saveCoupon(id: string | null, input: CouponFormInput) {
  await assertAdmin();
  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const code = parsed.data.code.toUpperCase();

  const data = {
    code,
    description: parsed.data.description || null,
    type: parsed.data.type,
    value: parsed.data.value,
    minOrder: parsed.data.minOrder ?? null,
    maxDiscount: parsed.data.maxDiscount ?? null,
    perUserLimit: parsed.data.perUserLimit ?? null,
    globalLimit: parsed.data.globalLimit ?? null,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    isActive: parsed.data.isActive,
    appliesToCategoryIds: (parsed.data.appliesToCategoryIds?.length ? parsed.data.appliesToCategoryIds : Prisma.JsonNull) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
  };

  if (id) {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return { ok: false as const, error: "Coupon not found." };
    const dup = await prisma.coupon.findUnique({ where: { code } });
    if (dup && dup.id !== id) return { ok: false as const, error: "Code already in use." };
    await prisma.coupon.update({ where: { id }, data });
    await recordAudit({ action: "coupon.update", entityType: "Coupon", entityId: id, before: { code: existing.code, isActive: existing.isActive }, after: { code, isActive: parsed.data.isActive } });
  } else {
    const dup = await prisma.coupon.findUnique({ where: { code } });
    if (dup) return { ok: false as const, error: "Code already in use." };
    const created = await prisma.coupon.create({ data });
    await recordAudit({ action: "coupon.create", entityType: "Coupon", entityId: created.id, after: { code } });
  }
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function deleteCoupon(id: string) {
  await assertAdmin();
  const existing = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
  if (!existing) return;
  if (existing._count.redemptions > 0) {
    // Keep for audit — just deactivate
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    await recordAudit({ action: "coupon.deactivate", entityType: "Coupon", entityId: id, after: { reason: "deleted while in use" } });
  } else {
    await prisma.coupon.delete({ where: { id } });
    await recordAudit({ action: "coupon.delete", entityType: "Coupon", entityId: id, before: { code: existing.code } });
  }
  revalidatePath("/admin/coupons");
}
