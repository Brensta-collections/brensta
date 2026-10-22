import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "brensta_guest";

/**
 * Merge guest cart items into the user's cart, respecting stock caps.
 * Runs in a single transaction. Idempotent.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const jar = await cookies();
  const guestToken = jar.get(COOKIE)?.value;
  if (!guestToken) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: { include: { variant: { select: { id: true, stock: true } } } } },
  });
  if (!guestCart || guestCart.items.length === 0) {
    // still clear the cookie so a stale token doesn't linger
    jar.delete(COOKIE);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    for (const item of guestCart.items) {
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      const target = Math.min((existing?.qty ?? 0) + item.qty, item.variant.stock);
      if (target === 0) continue;
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { qty: target },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            qty: Math.min(item.qty, item.variant.stock),
            snapshotPrice: item.snapshotPrice,
          },
        });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });

  jar.delete(COOKIE);
}
