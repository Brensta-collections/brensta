import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import { getCart } from "@/lib/cart";
import { evaluateCoupon } from "@/lib/coupon-eval";
import { getSessionUserId } from "@/lib/auth-helpers";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CouponPanel } from "@/components/cart/CouponPanel";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Start exploring BRENSTA and add pieces you love."
          cta={{ label: "Shop All", href: "/shop" }}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      </div>
    );
  }

  // Classify every item against the live variant to show honest price/stock changes.
  const enriched = cart.items.map((it) => {
    const livePrice = Number(it.variant.salePrice ?? it.variant.price);
    const snapshot = Number(it.snapshotPrice);
    const stock = it.variant.stock;
    const productStatus = (it.product as { status?: string }).status;
    const available = it.variant.isActive && stock > 0 && productStatus === "PUBLISHED";
    const effectiveQty = Math.min(it.qty, Math.max(0, stock));
    const priceChanged = available && Math.round(livePrice * 100) !== Math.round(snapshot * 100);
    const qtyAdjusted = effectiveQty !== it.qty;
    return { ...it, livePrice, snapshot, available, effectiveQty, priceChanged, qtyAdjusted };
  });

  const anyIssue = enriched.some((e) => !e.available || e.priceChanged || e.qtyAdjusted);
  const subtotal = enriched.reduce((s, e) => s + (e.available ? e.livePrice * e.effectiveQty : 0), 0);

  // Re-validate any applied coupon against the current cart (handles expiry, min-order drift, etc.)
  let appliedCode: string | null = null;
  let appliedDiscount = 0;
  let couponInvalidReason: string | null = null;
  if (cart.couponCode && subtotal > 0) {
    const userId = await getSessionUserId();
    const cartCategoryIds = Array.from(
      new Set(cart.items.flatMap((it) => (it.product as { categories?: Array<{ categoryId: string }> }).categories?.map((c) => c.categoryId) ?? []))
    );
    const r = await evaluateCoupon({ code: cart.couponCode, subtotal, cartCategoryIds, userId });
    if (r.ok) {
      appliedCode = r.code;
      appliedDiscount = r.discount;
    } else {
      couponInvalidReason = r.error;
    }
  }

  const shippingThreshold = Number(process.env.SHIPPING_FREE_THRESHOLD_INR ?? 999);
  const shippingFlat = Number(process.env.SHIPPING_FLAT_RATE_INR ?? 50);
  const subtotalAfterCoupon = Math.max(0, subtotal - appliedDiscount);
  const shipping = subtotalAfterCoupon === 0 ? 0 : subtotalAfterCoupon >= shippingThreshold ? 0 : shippingFlat;
  const total = subtotalAfterCoupon + shipping;
  const checkoutDisabled = subtotal === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Your Cart</h1>
      <p className="mt-1 text-sm text-brand-muted">{cart.items.reduce((s, i) => s + i.qty, 0)} items</p>

      {anyIssue && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-charcoal/90">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
          <span>
            Some items in your cart have changed. We&apos;ve updated the subtotal to reflect current prices and availability.
            Please review before you check out.
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-brand-line border-y border-brand-line">
          {enriched.map((it) => {
            const options = it.variant.optionValues as Record<string, string>;
            const label = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(" · ");
            const notice = !it.available
              ? "No longer available"
              : it.qtyAdjusted
                ? `Only ${it.variant.stock} left — qty adjusted`
                : it.priceChanged
                  ? `Price updated to ${formatINR(it.livePrice)}`
                  : null;
            return (
              <CartLineItem
                key={it.id}
                item={{
                  id: it.id,
                  qty: it.qty,
                  snapshotPrice: it.available ? it.livePrice : it.snapshot,
                  productSlug: it.product.slug,
                  productName: it.product.name,
                  variantOptionLabel: label,
                  stock: it.variant.stock,
                  imageUrl: it.product.images[0]?.url ?? null,
                  notice,
                  unavailable: !it.available,
                }}
              />
            );
          })}
        </ul>

        <aside className="h-fit space-y-4 rounded-xl border border-brand-line bg-white p-6">
          <div>
            <h2 className="brand-wordmark text-xl text-charcoal">Order Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-muted">Subtotal</dt>
                <dd className="font-medium text-charcoal">{formatINR(subtotal)}</dd>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-gold-deep">
                  <dt>Coupon {appliedCode ? `(${appliedCode})` : ""}</dt>
                  <dd className="font-medium">− {formatINR(appliedDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-brand-muted">Shipping</dt>
                <dd className="font-medium text-charcoal">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-brand-line pt-3 text-base">
                <dt className="font-semibold text-charcoal">Total</dt>
                <dd className="font-semibold text-charcoal">{formatINR(total)}</dd>
              </div>
            </dl>
          </div>

          <CouponPanel initialCode={appliedCode} initialDiscount={appliedDiscount} />
          {couponInvalidReason && (
            <p className="rounded border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">
              Previously applied coupon &quot;{cart.couponCode}&quot; is no longer valid: {couponInvalidReason}
            </p>
          )}
          <LinkButton href="/checkout" variant="gold" size="lg" className="mt-6 w-full" disabled={checkoutDisabled}>
            Proceed to Checkout
          </LinkButton>
          <p className="mt-2 text-center text-[11px] text-brand-muted">
            {checkoutDisabled
              ? "Remove unavailable items to continue."
              : "You'll be asked to sign in if you haven't already."}
          </p>
          <Link href="/shop" className="mt-4 block text-center text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal">
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
