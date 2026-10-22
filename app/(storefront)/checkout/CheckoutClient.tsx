"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatINR } from "@/lib/utils";
import { placeOrder } from "@/lib/orders";

type Address = {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

type Item = {
  id: string;
  name: string;
  slug: string;
  qty: number;
  unitPrice: number;
  optionValues: Record<string, string>;
  image: string | null;
  stock: number;
};

export function CheckoutClient(props: {
  userEmail: string;
  userName: string;
  addresses: Address[];
  items: Item[];
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingFlat: number;
  shippingThreshold: number;
  codFee: number;
  codEnabled: boolean;
  initialTotal: number;
}) {
  const router = useRouter();
  const defaultId = props.addresses.find((a) => a.isDefault)?.id ?? props.addresses[0]?.id ?? "";
  const [addressId, setAddressId] = useState(defaultId);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">(props.codEnabled ? "COD" : "ONLINE");
  const [notes, setNotes] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotalAfterCoupon = Math.max(0, props.subtotal - props.couponDiscount);
  const shipping = subtotalAfterCoupon >= props.shippingThreshold ? 0 : props.shippingFlat;
  const codFee = paymentMethod === "COD" ? props.codFee : 0;
  const total = subtotalAfterCoupon + shipping + codFee;
  const expectedTotalPaise = useMemo(() => Math.round(total * 100), [total]);

  const selectedAddr = props.addresses.find((a) => a.id === addressId);

  function onPlaceOrder() {
    setErr(null);
    startTransition(async () => {
      const res = await placeOrder({
        addressId,
        paymentMethod,
        notes: notes || undefined,
        idempotencyKey,
        expectedTotalPaise,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.push(`/checkout/success/${res.orderNumber}`);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* ───── Contact ───── */}
        <section className="rounded-xl border border-brand-line bg-white p-6">
          <h2 className="brand-wordmark text-lg text-charcoal">Contact</h2>
          <p className="mt-1 text-sm text-brand-muted">We&apos;ll send order updates to this contact.</p>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm md:grid-cols-2">
            <div><dt className="text-brand-muted">Name</dt><dd className="text-charcoal">{props.userName || "—"}</dd></div>
            <div><dt className="text-brand-muted">Email</dt><dd className="text-charcoal">{props.userEmail}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-brand-muted">
            Edit in <Link href="/account/profile" className="underline underline-offset-2">My Profile</Link>.
          </p>
        </section>

        {/* ───── Address ───── */}
        <section className="rounded-xl border border-brand-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="brand-wordmark text-lg text-charcoal">Delivery Address</h2>
            <Link href="/account/addresses/new?next=/checkout" className="text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal">
              + Add new
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {props.addresses.map((a) => (
              <li key={a.id}>
                <label className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${addressId === a.id ? "border-gold bg-gold/5" : "border-brand-line bg-ivory hover:border-gold"}`}>
                  <input type="radio" name="address" className="mt-1" value={a.id} checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <div className="text-sm">
                    <p className="font-semibold text-charcoal">
                      {a.name}{a.label ? ` · ${a.label}` : ""}
                      {a.isDefault && <span className="ml-2 rounded bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-deep">Default</span>}
                    </p>
                    <p className="mt-1 text-charcoal/80">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                    <p className="text-charcoal/80">{a.city}, {a.state} — {a.pincode}</p>
                    <p className="mt-1 text-xs text-brand-muted">Mobile: {a.phone}</p>
                    <Link href={`/account/addresses/${a.id}/edit`} className="mt-1 inline-block text-xs text-gold-deep hover:underline underline-offset-4">Edit</Link>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* ───── Items ───── */}
        <section className="rounded-xl border border-brand-line bg-white p-6">
          <h2 className="brand-wordmark text-lg text-charcoal">Items ({props.items.length})</h2>
          <ul className="mt-4 divide-y divide-brand-line">
            {props.items.map((it) => {
              const label = Object.entries(it.optionValues).map(([k, v]) => `${k}: ${v}`).join(" · ");
              const isPlaceholder = !it.image || it.image.startsWith("placeholder:");
              return (
                <li key={it.id} className="flex items-start gap-4 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-brand-line bg-champagne/30">
                    {isPlaceholder ? (
                      <PlaceholderImage seed={it.slug} label={it.name} aspect="square" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image!} alt={it.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-charcoal">{it.name}</p>
                    {label && <p className="mt-0.5 text-xs text-brand-muted">{label}</p>}
                    <p className="mt-1 text-xs text-brand-muted">Qty: {it.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-charcoal">{formatINR(it.unitPrice * it.qty)}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ───── Payment ───── */}
        <section className="rounded-xl border border-brand-line bg-white p-6">
          <h2 className="brand-wordmark text-lg text-charcoal">Payment</h2>
          <div className="mt-3 space-y-3">
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${paymentMethod === "COD" ? "border-gold bg-gold/5" : "border-brand-line bg-ivory"}`}>
              <input type="radio" name="pay" className="mt-1" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} disabled={!props.codEnabled} />
              <div>
                <p className="text-sm font-semibold text-charcoal">Cash on Delivery</p>
                <p className="mt-0.5 text-xs text-brand-muted">+ {formatINR(props.codFee)} handling fee. Pay in cash when your order is delivered.</p>
              </div>
            </label>
            <label className="flex cursor-not-allowed items-start gap-3 rounded-lg border border-brand-line bg-ivory p-4 opacity-60">
              <input type="radio" disabled />
              <div>
                <p className="text-sm font-semibold text-charcoal">UPI · Cards · Netbanking</p>
                <p className="mt-0.5 text-xs text-brand-muted">Online payment arrives in Milestone 6 (Razorpay sandbox → live).</p>
              </div>
            </label>
          </div>
        </section>

        {/* ───── Notes ───── */}
        <section className="rounded-xl border border-brand-line bg-white p-6">
          <h2 className="brand-wordmark text-lg text-charcoal">Order notes (optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 400))}
            rows={3}
            placeholder="Delivery instructions, gift message, etc."
            className="mt-3 block w-full rounded-lg border border-brand-line bg-ivory px-3 py-2.5 text-sm text-charcoal placeholder:text-brand-muted/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </section>
      </div>

      {/* ───── Summary ───── */}
      <aside className="h-fit rounded-xl border border-brand-line bg-white p-6 lg:sticky lg:top-24">
        <h2 className="brand-wordmark text-xl text-charcoal">Order Summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-brand-muted">Subtotal</dt><dd className="font-medium text-charcoal">{formatINR(props.subtotal)}</dd></div>
          {props.couponDiscount > 0 && (
            <div className="flex justify-between text-gold-deep">
              <dt>Coupon {props.couponCode ? `(${props.couponCode})` : ""}</dt>
              <dd className="font-medium">− {formatINR(props.couponDiscount)}</dd>
            </div>
          )}
          <p className="rounded border border-brand-line bg-ivory px-2 py-1.5 text-[11px] text-brand-muted">
            Pincode serviceability is confirmed by our courier at dispatch. If your address is not serviceable, we will contact you to arrange an alternative or a refund.
          </p>
          <div className="flex justify-between">
            <dt className="text-brand-muted">Shipping</dt>
            <dd className="font-medium text-charcoal">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
          </div>
          {paymentMethod === "COD" && (
            <div className="flex justify-between"><dt className="text-brand-muted">COD handling</dt><dd className="font-medium text-charcoal">{formatINR(codFee)}</dd></div>
          )}
          <div className="flex justify-between border-t border-brand-line pt-3 text-base">
            <dt className="font-semibold text-charcoal">Total</dt>
            <dd className="font-semibold text-charcoal">{formatINR(total)}</dd>
          </div>
        </dl>

        {err && <div className="mt-4 rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">{err}</div>}

        <Button type="button" variant="gold" size="lg" className="mt-6 w-full" onClick={onPlaceOrder} disabled={pending || !selectedAddr}>
          {pending ? "Placing order…" : `Place order · ${formatINR(total)}`}
        </Button>
        <p className="mt-3 text-center text-[11px] text-brand-muted">
          Demo products are seeded for development only. No real orders are fulfilled yet.
        </p>
      </aside>
    </div>
  );
}
