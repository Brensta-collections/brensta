import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCart } from "@/lib/cart";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Your Cart" };

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

  const subtotal = cart.items.reduce((s, i) => s + Number(i.snapshotPrice) * i.qty, 0);
  const shippingThreshold = Number(process.env.SHIPPING_FREE_THRESHOLD_INR ?? 999);
  const shippingFlat = Number(process.env.SHIPPING_FLAT_RATE_INR ?? 50);
  const shipping = subtotal >= shippingThreshold ? 0 : shippingFlat;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Your Cart</h1>
      <p className="mt-1 text-sm text-brand-muted">{cart.items.reduce((s, i) => s + i.qty, 0)} items</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-brand-line border-y border-brand-line">
          {cart.items.map((it) => {
            const options = it.variant.optionValues as Record<string, string>;
            const label = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(" · ");
            return (
              <CartLineItem
                key={it.id}
                item={{
                  id: it.id,
                  qty: it.qty,
                  snapshotPrice: Number(it.snapshotPrice),
                  productSlug: it.product.slug,
                  productName: it.product.name,
                  variantOptionLabel: label,
                  stock: it.variant.stock,
                  imageUrl: it.product.images[0]?.url ?? null,
                }}
              />
            );
          })}
        </ul>

        <aside className="h-fit rounded-xl border border-brand-line bg-white p-6">
          <h2 className="brand-wordmark text-xl text-charcoal">Order Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Subtotal</dt>
              <dd className="font-medium text-charcoal">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">Shipping</dt>
              <dd className="font-medium text-charcoal">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-brand-line pt-3 text-base">
              <dt className="font-semibold text-charcoal">Total</dt>
              <dd className="font-semibold text-charcoal">{formatINR(total)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="mt-6 block">
            <Button variant="gold" size="lg" className="w-full" disabled>
              Proceed to Checkout
            </Button>
          </Link>
          <p className="mt-2 text-center text-[11px] text-brand-muted">
            Checkout opens in Milestone 4 (auth + address + order creation).
          </p>
          <Link href="/shop" className="mt-4 block text-center text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal">
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
