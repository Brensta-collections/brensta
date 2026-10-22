"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin, requireStrictAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import type { Prisma, UserRole } from "@prisma/client";

const SAFE_SELECT = {
  id: true, email: true, name: true, phone: true, role: true, isActive: true,
  createdAt: true, emailVerified: true,
} as const;

export async function listCustomers(opts: { q?: string; role?: UserRole | "ALL"; page?: number }) {
  await assertAdmin();
  const where: Prisma.UserWhereInput = {};
  if (opts.role && opts.role !== "ALL") where.role = opts.role;
  if (opts.q) {
    where.OR = [
      { email: { contains: opts.q, mode: "insensitive" } },
      { name: { contains: opts.q, mode: "insensitive" } },
      { phone: { contains: opts.q } },
    ];
  }
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        ...SAFE_SELECT,
        _count: { select: { orders: true, addresses: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
}

export async function getCustomer(id: string) {
  await assertAdmin();
  const [user, orders, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: SAFE_SELECT }),
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { placedAt: "desc" },
      take: 20,
      select: { id: true, number: true, status: true, total: true, placedAt: true },
    }),
    prisma.address.findMany({ where: { userId: id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }),
  ]);
  return user ? { user, orders, addresses } : null;
}

export async function toggleCustomerActive(id: string) {
  const admin = await requireStrictAdmin();
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, isActive: true, role: true } });
  if (!user) return;
  // Can't deactivate yourself
  if (user.id === admin.id) return;
  const next = !user.isActive;
  await prisma.user.update({ where: { id }, data: { isActive: next } });
  await recordAudit({ action: next ? "customer.activate" : "customer.deactivate", entityType: "User", entityId: id, before: { isActive: user.isActive }, after: { isActive: next } });
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
}
