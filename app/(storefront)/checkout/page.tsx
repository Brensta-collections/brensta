import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { getCart } from "@/lib/cart";
import { listAddresses } from "@/lib/addresses";
import { computeTotals, getShippingConfig } from "@/lib/shipping";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

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

  const subtotal = cart.items.reduce((s, i) => s + Number(i.snapshotPrice) * i.qty, 0);
  const cfg = getShippingConfig();

  const items = cart.items.map((i) => ({
    id: i.id,
    name: i.product.name,
    slug: i.product.slug,
    qty: i.qty,
    unitPrice: Number(i.snapshotPrice),
    optionValues: i.variant.optionValues as Record<string, string>,
    image: i.product.images[0]?.url ?? null,
    stock: i.variant.stock,
  }));
  const totalsCOD = computeTotals(subtotal, "COD");

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
