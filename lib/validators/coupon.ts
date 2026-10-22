import { z } from "zod";

export const couponFormSchema = z
  .object({
    code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9][A-Z0-9_-]*$/i, "Letters, digits, dashes, underscores."),
    description: z.string().max(200).optional().or(z.literal("")),
    type: z.enum(["FLAT", "PERCENT"]),
    value: z.number().positive(),
    minOrder: z.number().positive().optional().nullable(),
    maxDiscount: z.number().positive().optional().nullable(),
    perUserLimit: z.number().int().positive().optional().nullable(),
    globalLimit: z.number().int().positive().optional().nullable(),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    appliesToCategoryIds: z.array(z.string()).optional(),
  })
  .refine((v) => v.type !== "PERCENT" || v.value <= 90, { message: "Percent discounts cannot exceed 90.", path: ["value"] })
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.startsAt) < new Date(v.endsAt), {
    message: "End date must be after start date.",
    path: ["endsAt"],
  });

export type CouponFormInput = z.infer<typeof couponFormSchema>;

/**
 * Pure, server-side coupon validation + discount calculation.
 * Returns a discount amount in rupees (not paise). Used by cart/checkout and tests.
 */
export function calcCouponDiscount(
  coupon: {
    code: string;
    type: "FLAT" | "PERCENT";
    value: number;
    minOrder?: number | null;
    maxDiscount?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    isActive: boolean;
    appliesToCategoryIds?: string[] | null;
  },
  input: {
    subtotal: number;
    now?: Date;
    cartCategoryIds?: string[];
    userRedemptions?: number;
    perUserLimit?: number | null;
    globalRedemptions?: number;
    globalLimit?: number | null;
  }
): { ok: true; discount: number } | { ok: false; error: string } {
  const now = input.now ?? new Date();
  if (!coupon.isActive) return { ok: false, error: "This coupon is not active." };
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return { ok: false, error: "This coupon isn't valid yet." };
  if (coupon.endsAt && now > new Date(coupon.endsAt)) return { ok: false, error: "This coupon has expired." };
  if (coupon.minOrder && input.subtotal < coupon.minOrder) return { ok: false, error: `Minimum order ₹${coupon.minOrder}.` };
  if (input.perUserLimit && (input.userRedemptions ?? 0) >= input.perUserLimit) return { ok: false, error: "You've already used this coupon." };
  if (input.globalLimit && (input.globalRedemptions ?? 0) >= input.globalLimit) return { ok: false, error: "This coupon has reached its limit." };
  if (coupon.appliesToCategoryIds && coupon.appliesToCategoryIds.length > 0) {
    const cart = input.cartCategoryIds ?? [];
    if (!cart.some((c) => coupon.appliesToCategoryIds!.includes(c))) {
      return { ok: false, error: "No eligible items in your cart for this coupon." };
    }
  }
  let discount = coupon.type === "FLAT" ? coupon.value : (input.subtotal * coupon.value) / 100;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, input.subtotal);
  return { ok: true, discount: Math.round(discount) };
}
