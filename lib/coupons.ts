"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-helpers";
import { getOrCreateGuestToken, getGuestToken } from "@/lib/guest";
import { evaluateCoupon } from "@/lib/coupon-eval";
import type { CouponApplyResult } from "@/lib/coupon-eval";
import type { Prisma } from "@prisma/client";

async function cartOwnerFilter() {
  const userId = await getSessionUserId();
  if (userId) return { where: { userId } as Prisma.CartWhereInput };
  const token = await getGuestToken();
  if (!token) return null;
  return { where: { guestToken: token } as Prisma.CartWhereInput };
}

/** Load the current owner's cart + the list of distinct category ids spanned by its items. */
async function loadCartContext() {
  const own = await cartOwnerFilter();
  if (!own) return null;
  const cart = await prisma.cart.findFirst({
    where: own.where,
    include: {
      items: {
        include: {
          variant: { select: { price: true, salePrice: true, stock: true, isActive: true } },
          product: { include: { categories: { select: { categoryId: true } } } },
        },
      },
    },
  });
  if (!cart) return null;
  const subtotal = cart.items.reduce((s, it) => {
    if (!it.variant.isActive || it.variant.stock <= 0) return s;
    const unit = Number(it.variant.salePrice ?? it.variant.price);
    return s + unit * Math.min(it.qty, it.variant.stock);
  }, 0);
  const cartCategoryIds = Array.from(new Set(cart.items.flatMap((i) => i.product.categories.map((c) => c.categoryId))));
  return { cart, subtotal, cartCategoryIds };
}

export async function applyCouponToCart(rawCode: string): Promise<CouponApplyResult> {
  const ctx = await loadCartContext();
  if (!ctx) {
    await getOrCreateGuestToken();
    return { ok: false, error: "Your cart is empty. Add items before applying a coupon." };
  }
  if (ctx.subtotal === 0) return { ok: false, error: "No eligible items in your cart." };

  const userId = await getSessionUserId();
  const result = await evaluateCoupon({
    code: rawCode,
    subtotal: ctx.subtotal,
    cartCategoryIds: ctx.cartCategoryIds,
    userId,
  });
  if (!result.ok) return result;

  await prisma.cart.update({ where: { id: ctx.cart.id }, data: { couponCode: result.code } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return result;
}

export async function removeCouponFromCart(): Promise<{ ok: true }> {
  const own = await cartOwnerFilter();
  if (!own) return { ok: true };
  const cart = await prisma.cart.findFirst({ where: own.where, select: { id: true } });
  if (cart) await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true };
}

/**
 * Server-side re-validation used by placeOrder (same context, same rules).
 * Returns {discount, couponId, code} on success, or null if no coupon is applied / invalid.
 */
export async function evaluateCartCoupon(userId: string): Promise<{ discount: number; couponId: string; code: string } | null> {
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          variant: { select: { price: true, salePrice: true, stock: true, isActive: true } },
          product: { include: { categories: { select: { categoryId: true } } } },
        },
      },
    },
  });
  if (!cart || !cart.couponCode || cart.items.length === 0) return null;

  const subtotal = cart.items.reduce((s, it) => {
    if (!it.variant.isActive || it.variant.stock <= 0) return s;
    const unit = Number(it.variant.salePrice ?? it.variant.price);
    return s + unit * Math.min(it.qty, it.variant.stock);
  }, 0);
  const cartCategoryIds = Array.from(new Set(cart.items.flatMap((i) => i.product.categories.map((c) => c.categoryId))));
  const r = await evaluateCoupon({ code: cart.couponCode, subtotal, cartCategoryIds, userId });
  if (!r.ok) return null;
  const coupon = await prisma.coupon.findUnique({ where: { code: r.code }, select: { id: true } });
  if (!coupon) return null;
  return { discount: r.discount, couponId: coupon.id, code: r.code };
}
