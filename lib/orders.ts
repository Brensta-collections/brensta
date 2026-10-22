"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-helpers";
import { getCart } from "@/lib/cart";
import { computeTotals } from "@/lib/shipping";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const key = `order.counter.${year}`;
  // Atomic increment via a transaction + row lock on the Setting row
  const seq: number = await prisma.$transaction(async (tx) => {
    const row = await tx.setting.findUnique({ where: { key } });
    const current = typeof (row?.value as { seq?: number } | null)?.seq === "number" ? (row!.value as { seq: number }).seq : 0;
    const next = current + 1;
    await tx.setting.upsert({
      where: { key },
      update: { value: { seq: next } },
      create: { key, value: { seq: next } },
    });
    return next;
  });
  return `${process.env.ORDER_PREFIX ?? "BRN"}-${year}-${String(seq).padStart(6, "0")}`;
}

export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please sign in to place an order." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // ─ Idempotency: if we've already stored an order with this key, return it.
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey } });
  if (existing) {
    if (existing.userId !== userId) return { ok: false, error: "Order could not be verified." };
    return { ok: true, orderNumber: existing.number };
  }

  // ─ Load the user's address (ownership-checked)
  const address = await prisma.address.findUnique({ where: { id: parsed.data.addressId } });
  if (!address || address.userId !== userId) return { ok: false, error: "Selected address could not be found." };

  // ─ Load the cart; must have items
  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) return { ok: false, error: "Your cart is empty." };

  // ─ Compute authoritative subtotal from live variant data
  const liveVariants = await prisma.productVariant.findMany({
    where: { id: { in: cart.items.map((i) => i.variantId) } },
    select: { id: true, productId: true, sku: true, price: true, salePrice: true, stock: true, isActive: true, optionValues: true },
  });
  const variantById = new Map(liveVariants.map((v) => [v.id, v]));

  let subtotal = 0;
  for (const item of cart.items) {
    const v = variantById.get(item.variantId);
    if (!v || !v.isActive) return { ok: false, error: "An item in your cart is no longer available. Please review the cart." };
    if (v.stock < item.qty) return { ok: false, error: `Only ${v.stock} unit(s) left for one of your items. Please update your cart.` };
    const unit = Number(v.salePrice ?? v.price);
    subtotal += unit * item.qty;
  }
  const totals = computeTotals(subtotal, parsed.data.paymentMethod);
  const expectedPaise = Math.round(totals.total * 100);
  // If the client-sent expected total disagrees, reject (prevents stale prices)
  if (parsed.data.expectedTotalPaise !== expectedPaise) {
    return { ok: false, error: "Prices or availability have changed since you opened checkout. Please review your cart." };
  }
  if (parsed.data.paymentMethod === "ONLINE") {
    return { ok: false, error: "Online payment arrives in Milestone 6. Please choose Cash on Delivery for now." };
  }

  // ─ Atomic transaction: lock stock, snapshot, create order
  const number = await nextOrderNumber();
  try {
    await prisma.$transaction(async (tx) => {
      // Fresh snapshot inside txn
      const freshCart = await tx.cart.findFirst({
        where: { userId },
        include: { items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } }, variant: true } } },
      });
      if (!freshCart || freshCart.items.length === 0) throw new Error("CART_EMPTY");

      // Atomically decrement stock; abort if any item fails
      for (const item of freshCart.items) {
        const update = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.qty }, isActive: true },
          data: { stock: { decrement: item.qty } },
        });
        if (update.count === 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      // Create order
      const order = await tx.order.create({
        data: {
          number,
          userId,
          email: freshCart.items[0]?.product ? (await tx.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? "" : "",
          phone: address.phone,
          status: "PENDING",
          subtotal,
          discount: 0,
          shipping: totals.shipping - totals.codFee,
          tax: 0,
          total: totals.total,
          currency: "INR",
          shippingAddress: {
            name: address.name,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
            label: address.label,
          } as Prisma.JsonObject,
          billingAddress: {
            name: address.name,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
            label: address.label,
          } as Prisma.JsonObject,
          notes: parsed.data.notes || null,
          idempotencyKey: parsed.data.idempotencyKey,
          placedAt: new Date(),
        },
      });

      // Order items (immutable snapshots)
      for (const item of freshCart.items) {
        const unit = Number(item.variant.salePrice ?? item.variant.price);
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            nameSnapshot: item.product.name,
            skuSnapshot: item.variant.sku,
            imageSnapshot: item.product.images[0]?.url ?? null,
            unitPrice: unit,
            qty: item.qty,
            lineTotal: unit * item.qty,
            attributesSnapshot: item.variant.optionValues as Prisma.JsonObject,
          },
        });
        await tx.stockLedger.create({
          data: {
            variantId: item.variantId,
            delta: -item.qty,
            reason: "order",
            orderId: order.id,
            userId,
            note: `Order ${order.number}`,
          },
        });
      }

      // Initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: "PENDING",
          byUserId: userId,
          reason: "Order placed",
        },
      });

      // Payment row (COD → CREATED; actual capture happens on delivery or manual admin update)
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "COD",
          providerOrderId: `COD-${order.number}`,
          amount: totals.total,
          currency: "INR",
          status: "CREATED",
          rawPayload: { method: "COD", note: "Collected on delivery" } as Prisma.JsonObject,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: freshCart.id } });
      await tx.cart.update({ where: { id: freshCart.id }, data: { couponCode: null } });
    }, { timeout: 15_000 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "INSUFFICIENT_STOCK") return { ok: false, error: "An item sold out while you were checking out. Please review your cart." };
    if (msg === "CART_EMPTY") return { ok: false, error: "Your cart became empty. Please add items again." };
    console.error("[placeOrder] failed", e);
    return { ok: false, error: "Could not place order. Please try again." };
  }

  revalidatePath("/cart");
  revalidatePath("/account/orders");
  return { ok: true, orderNumber: number };
}

export async function listMyOrders() {
  const userId = await getSessionUserId();
  if (!userId) return [];
  return prisma.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    include: {
      items: { select: { id: true, nameSnapshot: true, imageSnapshot: true, qty: true, unitPrice: true, lineTotal: true } },
      payments: { select: { provider: true, status: true } },
    },
  });
}

export async function getMyOrder(number: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const order = await prisma.order.findUnique({
    where: { number },
    include: {
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      payments: true,
      shipments: true,
    },
  });
  if (!order || order.userId !== userId) return null;
  return order;
}
