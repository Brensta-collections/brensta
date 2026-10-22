"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import { bannerSchema, type BannerInput } from "@/lib/validators/banner";

export async function listBanners() {
  await assertAdmin();
  return prisma.banner.findMany({ orderBy: [{ section: "asc" }, { sortOrder: "asc" }] });
}

export async function saveBanner(id: string | null, input: BannerInput) {
  await assertAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = {
    section: parsed.data.section,
    title: parsed.data.title || null,
    subtitle: parsed.data.subtitle || null,
    imageUrl: parsed.data.imageUrl,
    ctaText: parsed.data.ctaText || null,
    ctaUrl: parsed.data.ctaUrl || null,
    categoryId: parsed.data.categoryId || null,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  };
  if (id) {
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return { ok: false as const, error: "Banner not found." };
    await prisma.banner.update({ where: { id }, data });
    await recordAudit({ action: "banner.update", entityType: "Banner", entityId: id, after: { section: data.section } });
  } else {
    const created = await prisma.banner.create({ data });
    await recordAudit({ action: "banner.create", entityType: "Banner", entityId: created.id, after: { section: data.section } });
  }
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteBanner(id: string) {
  await assertAdmin();
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.banner.delete({ where: { id } });
  await recordAudit({ action: "banner.delete", entityType: "Banner", entityId: id, before: { section: existing.section } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
