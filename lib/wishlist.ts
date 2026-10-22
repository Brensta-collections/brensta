"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * Wishlist requires an authenticated user.
 * M4 wires NextAuth; until then this returns a signal for UI to prompt sign-in.
 */
export async function getCurrentUserId(): Promise<string | null> {
  // TODO M4: pull from auth session
  return null;
}

export async function toggleWishlist(productId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false as const, error: "SIGNIN_REQUIRED" };

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

export async function getWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
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
