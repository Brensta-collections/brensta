import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { getCart } from "@/lib/cart";
import { listAddresses } from "@/lib/addresses";
import { computeTotals, getShippingConfig } from "@/lib/shipping";
import { evaluateCoupon } from "@/lib/coupon-eval";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await requireUser();
  const [cart, addresses] = await Promise.all([getCart(user.id), listAddresses()]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState title="Your cart is empty" description="Add some items before checking out." cta={{ label: "Shop", href: "/shop" }} />
      </div>
    );
  }

  // Use live variant prices to compute an authoritative subtotal.
  const subtotal = cart.items.reduce((s, i) => {
    if (!i.variant.isActive) return s;
    const unit = Number(i.variant.salePrice ?? i.variant.price);
    return s + unit * Math.min(i.qty, i.variant.stock);
  }, 0);
  const cfg = getShippingConfig();

  // Re-validate any applied coupon.
  let appliedCode: string | null = null;
  let appliedDiscount = 0;
  if (cart.couponCode && subtotal > 0) {
    const cartCategoryIds = Array.from(new Set(cart.items.flatMap((i) => i.product.categories.map((c) => c.categoryId))));
    const r = await evaluateCoupon({ code: cart.couponCode, subtotal, cartCategoryIds, userId: user.id });
    if (r.ok) {
      appliedCode = r.code;
      appliedDiscount = r.discount;
    }
  }

  const items = cart.items.map((i) => ({
    id: i.id,
    name: i.product.name,
    slug: i.product.slug,
    qty: Math.min(i.qty, i.variant.stock),
    unitPrice: Number(i.variant.salePrice ?? i.variant.price),
    optionValues: i.variant.optionValues as Record<string, string>,
    image: i.product.images[0]?.url ?? null,
    stock: i.variant.stock,
  }));
  const totalsCOD = computeTotals(Math.max(0, subtotal - appliedDiscount), "COD");

  const addrs = addresses.map((a) => ({
    id: a.id,
    label: a.label,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    isDefault: a.isDefault,
  }));

  if (addrs.length === 0) {
    redirect("/account/addresses/new?next=/checkout");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Checkout</h1>
      <p className="mt-1 text-sm text-brand-muted">Verify your details and confirm your order.</p>
      <CheckoutClient
        userEmail={user.email ?? ""}
        userName={user.name ?? ""}
        addresses={addrs}
        items={items}
        subtotal={subtotal}
        couponCode={appliedCode}
        couponDiscount={appliedDiscount}
        shippingFlat={cfg.shipping}
        shippingThreshold={cfg.freeShippingThreshold}
        codFee={cfg.codFee}
        codEnabled={cfg.codEnabled}
        initialTotal={totalsCOD.total}
      />
      <p className="mt-6 text-center text-xs text-brand-muted">
        <Link href="/cart" className="underline underline-offset-2">← Edit cart</Link>
      </p>
    </div>
  );
}
