"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import { ALLOWED_TRANSITIONS } from "@/lib/order-status";
import type { OrderStatus, Prisma } from "@prisma/client";

export async function listAdminOrders(opts: { q?: string; status?: OrderStatus | "ALL"; from?: string; to?: string; page?: number; perPage?: number }) {
  await assertAdmin();
  const where: Prisma.OrderWhereInput = {};
  if (opts.status && opts.status !== "ALL") where.status = opts.status;
  if (opts.q) {
    where.OR = [
      { number: { contains: opts.q, mode: "insensitive" } },
      { email: { contains: opts.q, mode: "insensitive" } },
      { phone: { contains: opts.q } },
    ];
  }
  if (opts.from || opts.to) {
    where.placedAt = {};
    if (opts.from) where.placedAt.gte = new Date(opts.from);
    if (opts.to) where.placedAt.lte = new Date(opts.to + "T23:59:59.999");
  }
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(100, opts.perPage ?? 25);
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { id: true, nameSnapshot: true, qty: true, lineTotal: true } },
        payments: { select: { provider: true, status: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
}

export async function getAdminOrder(number: string) {
  await assertAdmin();
  return prisma.order.findUnique({
    where: { number },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      items: true,
      history: { orderBy: { createdAt: "asc" }, include: { byUser: { select: { name: true, email: true } } } },
      payments: true,
      shipments: true,
      returns: true,
    },
  });
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus, reason?: string, tracking?: { courier?: string; number?: string; url?: string }) {
  const admin = await assertAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } });
  if (!order) return { ok: false as const, error: "Order not found." };
  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { ok: false as const, error: `Cannot move from ${order.status} to ${nextStatus}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: nextStatus, byUserId: admin.id, reason: reason ?? null },
    });

    // Side-effects
    if (nextStatus === "CANCELLED") {
      // Restore stock
      for (const item of order.items) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } });
        await tx.stockLedger.create({ data: { variantId: item.variantId, delta: item.qty, reason: "cancellation", orderId: order.id, userId: admin.id, note: `Order ${order.number} cancelled` } });
      }
      // Mark COD payment FAILED (never captured). Online payments require real refund via provider in M6.
      for (const p of order.payments) {
        if (p.provider === "COD" && p.status === "CREATED") {
          await tx.payment.update({ where: { id: p.id }, data: { status: "FAILED" } });
        }
      }
    }
    if (nextStatus === "SHIPPED" && tracking) {
      await tx.shipment.create({
        data: {
          orderId,
          courier: tracking.courier || null,
          trackingNumber: tracking.number || null,
          trackingUrl: tracking.url || null,
          status: "shipped",
          shippedAt: new Date(),
        },
      });
    }
    if (nextStatus === "DELIVERED") {
      await tx.shipment.updateMany({ where: { orderId }, data: { status: "delivered", deliveredAt: new Date() } });
      // COD payments can be marked CAPTURED on delivery confirmation (we have real cash proof)
      for (const p of order.payments) {
        if (p.provider === "COD" && p.status !== "CAPTURED") {
          await tx.payment.update({ where: { id: p.id }, data: { status: "CAPTURED" } });
        }
      }
    }
  });

  await recordAudit({ action: "order.status", entityType: "Order", entityId: orderId, before: { status: order.status }, after: { status: nextStatus, reason: reason ?? null } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.number}`);
  revalidatePath(`/account/orders/${order.number}`);
  return { ok: true as const };
}
