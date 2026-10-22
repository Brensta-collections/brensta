"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateGuestToken, getGuestToken } from "@/lib/guest";
import type { Prisma } from "@prisma/client";

async function getOrCreateCart(ownerUserId?: string | null) {
  if (ownerUserId) {
    return prisma.cart.upsert({
      where: { userId: ownerUserId },
      update: {},
      create: { userId: ownerUserId },
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
  const token = ownerUserId ? null : await getGuestToken();
  if (!ownerUserId && !token) return null;
  const cart = await prisma.cart.findFirst({
    where: ownerUserId ? { userId: ownerUserId } : { guestToken: token! },
    include: {
      items: {
        include: {
          product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return cart;
}

export async function addToCart(variantId: string, qty = 1) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, productId: true, price: true, salePrice: true, stock: true, isActive: true },
  });
  if (!variant || !variant.isActive) {
    return { ok: false as const, error: "This item is no longer available." };
  }
  if (variant.stock < qty) {
    return { ok: false as const, error: "Not enough stock available." };
  }
  const cart = await getOrCreateCart();
  const snapshot = (variant.salePrice ?? variant.price) as unknown as Prisma.Decimal;

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { qty: { increment: qty } },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      qty,
      snapshotPrice: snapshot,
    },
  });

  revalidatePath("/cart");
  return { ok: true as const };
}

export async function removeFromCart(cartItemId: string) {
  await prisma.cartItem.delete({ where: { id: cartItemId } }).catch(() => null);
  revalidatePath("/cart");
}

export async function updateCartItemQty(cartItemId: string, qty: number) {
  if (qty <= 0) return removeFromCart(cartItemId);
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { variant: { select: { stock: true } } },
  });
  if (!item) return;
  const safeQty = Math.min(qty, item.variant.stock);
  await prisma.cartItem.update({ where: { id: cartItemId }, data: { qty: safeQty } });
  revalidatePath("/cart");
}

export async function getCartCount(ownerUserId?: string | null): Promise<number> {
  const cart = await getCart(ownerUserId);
  if (!cart) return 0;
  return cart.items.reduce((s, i) => s + i.qty, 0);
}
