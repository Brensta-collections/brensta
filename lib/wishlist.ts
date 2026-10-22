"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-helpers";
import { getOrCreateGuestToken, getGuestToken } from "@/lib/guest";

/**
 * Ownership model
 * ----------------
 * Wishlist rows have EXACTLY one of (userId, guestToken) set:
 *   - userId  → logged-in customer
 *   - guestToken → anonymous visitor identified by the httpOnly brensta_guest cookie (same mechanism as the guest cart)
 *
 * Guests can like products without logging in. On sign-in we merge guest entries
 * into the user's own wishlist (deduplicated, invalid products skipped) via
 * lib/wishlist-merge.ts, which auth.ts calls from events.signIn.
 */

export async function getCurrentUserId(): Promise<string | null> {
  return getSessionUserId();
}

export async function toggleWishlist(productId: string) {
  if (!productId) return { ok: false as const, error: "Invalid product." };
  // Ensure the product exists and is published before storing a wishlist row.
  const prod = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
  if (!prod) return { ok: false as const, error: "Product not found." };

  const userId = await getSessionUserId();

  if (userId) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
    } else {
      await prisma.wishlist.create({ data: { userId, productId } });
    }
    revalidatePath("/wishlist");
    return { ok: true as const, added: !existing };
  }

  // Guest: identify via brensta_guest cookie (same server-managed token as the cart).
  const token = await getOrCreateGuestToken();
  const existing = await prisma.wishlist.findUnique({
    where: { guestToken_productId: { guestToken: token, productId } },
  });
  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlist.create({ data: { guestToken: token, productId } });
  }
  revalidatePath("/wishlist");
  return { ok: true as const, added: !existing };
}

export async function removeFromWishlist(productId: string) {
  const userId = await getSessionUserId();
  if (userId) {
    await prisma.wishlist.deleteMany({ where: { userId, productId } });
    revalidatePath("/wishlist");
    return;
  }
  const token = await getGuestToken();
  if (!token) return;
  await prisma.wishlist.deleteMany({ where: { guestToken: token, productId } });
  revalidatePath("/wishlist");
}

/** Products currently in the wishlist of either the logged-in user or the guest cookie. */
export async function getWishlist() {
  const userId = await getSessionUserId();
  const token = userId ? null : await getGuestToken();
  if (!userId && !token) return [];
  return prisma.wishlist.findMany({
    where: userId ? { userId } : { guestToken: token! },
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Set of productIds in the current owner's wishlist. Used by product cards to show initial active state. */
export async function getWishlistProductIds(): Promise<Set<string>> {
  const userId = await getSessionUserId();
  const token = userId ? null : await getGuestToken();
  if (!userId && !token) return new Set();
  const rows = await prisma.wishlist.findMany({
    where: userId ? { userId } : { guestToken: token! },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}

export async function getWishlistCount(): Promise<number> {
  const userId = await getSessionUserId();
  const token = userId ? null : await getGuestToken();
  if (!userId && !token) return 0;
  return prisma.wishlist.count({ where: userId ? { userId } : { guestToken: token! } });
}
