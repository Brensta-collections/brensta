import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "brensta_guest";

/**
 * Core merge: move wishlist rows owned by `guestToken` to `userId`.
 * - Preserves existing user entries (createdAt stays original).
 * - Deduplicates by (userId, productId).
 * - Silently drops guest rows pointing at deleted or unpublished products.
 * - Deletes ALL rows for the token (including stale ones) only after the user rows are safely written.
 *
 * Exported so unit tests can call it with a known token without going through cookies().
 */
export async function mergeGuestWishlistRows(userId: string, guestToken: string): Promise<void> {
  const guestRows = await prisma.wishlist.findMany({ where: { guestToken }, select: { productId: true } });
  if (guestRows.length === 0) return;

  const validProductIds = (
    await prisma.product.findMany({
      where: { id: { in: guestRows.map((r) => r.productId) }, status: "PUBLISHED" },
      select: { id: true },
    })
  ).map((p) => p.id);

  if (validProductIds.length === 0) {
    await prisma.wishlist.deleteMany({ where: { guestToken } });
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const productId of validProductIds) {
      await tx.wishlist.upsert({
        where: { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
      });
    }
    await tx.wishlist.deleteMany({ where: { guestToken } });
  });
}

/** Cookie-aware wrapper invoked from auth.ts events.signIn. */
export async function mergeGuestWishlistIntoUser(userId: string): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return;
  await mergeGuestWishlistRows(userId, token);
}
