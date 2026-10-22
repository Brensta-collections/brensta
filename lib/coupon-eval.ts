import { prisma } from "@/lib/db";
import { calcCouponDiscount } from "@/lib/validators/coupon";

export type CouponApplyResult =
  | { ok: true; code: string; discount: number }
  | { ok: false; error: string };

/**
 * Canonical server-side coupon validation. Pure data-layer only — no auth, no cookies —
 * so it can be unit-tested cleanly and reused from cart/checkout code paths.
 */
export async function evaluateCoupon(args: {
  code: string;
  subtotal: number;
  cartCategoryIds: string[];
  userId?: string | null;
}): Promise<CouponApplyResult> {
  const code = (args.code ?? "").trim().toUpperCase();
  if (code.length === 0) return { ok: false, error: "Enter a coupon code." };
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { ok: false, error: "This coupon code is not valid." };

  const [userRedemptions, globalRedemptions] = await Promise.all([
    args.userId
      ? prisma.couponRedemption.count({ where: { couponId: coupon.id, userId: args.userId } })
      : Promise.resolve(0),
    prisma.couponRedemption.count({ where: { couponId: coupon.id } }),
  ]);

  const appliesTo = Array.isArray(coupon.appliesToCategoryIds) ? (coupon.appliesToCategoryIds as string[]) : undefined;
  const r = calcCouponDiscount(
    {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      isActive: coupon.isActive,
      appliesToCategoryIds: appliesTo,
    },
    {
      subtotal: args.subtotal,
      cartCategoryIds: args.cartCategoryIds,
      userRedemptions,
      perUserLimit: coupon.perUserLimit ?? null,
      globalRedemptions,
      globalLimit: coupon.globalLimit ?? null,
    }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, code: coupon.code, discount: r.discount };
}
