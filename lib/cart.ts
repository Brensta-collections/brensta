"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateGuestToken, getGuestToken } from "@/lib/guest";
import { getSessionUserId } from "@/lib/auth-helpers";
import type { Prisma } from "@prisma/client";

async function getOrCreateCart() {
  const userId = await getSessionUserId();
  if (userId) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  const token = await getOrCreateGuestToken();
  return prisma.cart.upsert({
    where: { guestToken: token },
    update: {},
    create: { guestToken: token },
  });
}

export async function getCart(ownerUserId?: string | null) {
  const userId = ownerUserId ?? (await getSessionUserId());
  const token = userId ? null : await getGuestToken();
  if (!userId && !token) return null;
  return prisma.cart.findFirst({
    where: userId ? { userId } : { guestToken: token! },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { sortOrder: "asc" } },
              categories: { select: { categoryId: true } },
            },
          },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function addToCart(variantId: string, qty = 1) {
  if (!Number.isFinite(qty) || qty < 1) {
    return { ok: false as const, error: "Invalid quantity." };
  }
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true, productId: true, price: true, salePrice: true, stock: true, isActive: true,
      product: { select: { status: true } },
    },
  });
  if (!variant || !variant.isActive || variant.product.status !== "PUBLISHED") {
    return { ok: false as const, error: "This item is no longer available." };
  }

  const cart = await getOrCreateCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });
  const requested = (existing?.qty ?? 0) + qty;
  if (variant.stock < requested) {
    return {
      ok: false as const,
      error: existing
        ? `You already have ${existing.qty} in your cart; only ${variant.stock} available in total.`
        : `Only ${variant.stock} available.`,
    };
  }

  const snapshot = (variant.salePrice ?? variant.price) as unknown as Prisma.Decimal;
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { qty: requested },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      qty,
      snapshotPrice: snapshot,
    },
  });

  revalidatePath("/cart");
  revalidatePath("/");
  return { ok: true as const };
}

export async function removeFromCart(cartItemId: string) {
  // ownership guard
  const userId = await getSessionUserId();
  const token = userId ? null : await getGuestToken();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: { select: { userId: true, guestToken: true } } },
  });
  if (!item) return;
  if (userId ? item.cart.userId !== userId : item.cart.guestToken !== token) return;
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
}

export async function updateCartItemQty(cartItemId: string, qty: number) {
  if (qty <= 0) return removeFromCart(cartItemId);
  const userId = await getSessionUserId();
  const token = userId ? null : await getGuestToken();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: { select: { userId: true, guestToken: true } },
      variant: { select: { stock: true } },
    },
  });
  if (!item) return;
  if (userId ? item.cart.userId !== userId : item.cart.guestToken !== token) return;
  const safeQty = Math.min(qty, item.variant.stock);
  await prisma.cartItem.update({ where: { id: cartItemId }, data: { qty: safeQty } });
  revalidatePath("/cart");
}

export async function getCartCount(ownerUserId?: string | null): Promise<number> {
  const cart = await getCart(ownerUserId);
  if (!cart) return 0;
  return cart.items.reduce((s, i) => s + i.qty, 0);
}
