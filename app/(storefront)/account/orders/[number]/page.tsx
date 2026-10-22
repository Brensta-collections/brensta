import { notFound } from "next/navigation";
import Link from "next/link";
import { getMyOrder } from "@/lib/orders";
import { formatINR } from "@/lib/utils";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export default async function OrderDetailPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getMyOrder(number);
  if (!order) notFound();

  const addr = order.shippingAddress as { name: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; phone: string };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-brand-line bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-brand-muted">#{order.number}</p>
            <h2 className="brand-wordmark text-xl text-charcoal">Order details</h2>
          </div>
          <span className="rounded-full bg-champagne px-3 py-1 text-xs font-semibold uppercase tracking-wider text-charcoal">{order.status}</span>
        </div>

        <ul className="mt-5 divide-y divide-brand-line border-y border-brand-line">
          {order.items.map((it) => {
            const placeholder = !it.imageSnapshot || it.imageSnapshot.startsWith("placeholder:");
            const attrs = it.attributesSnapshot as Record<string, string> | null;
            const label = attrs ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(" · ") : "";
            return (
              <li key={it.id} className="flex items-start gap-4 py-4">
                <div className="h-16 w-16 overflow-hidden rounded border border-brand-line bg-champagne/30">
                  {placeholder ? (
                    <PlaceholderImage seed={it.id} label={it.nameSnapshot} aspect="square" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageSnapshot!} alt={it.nameSnapshot} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{it.nameSnapshot}</p>
                  <p className="text-xs text-brand-muted">SKU {it.skuSnapshot}{label ? ` · ${label}` : ""}</p>
                  <p className="mt-1 text-xs text-brand-muted">Qty {it.qty} × {formatINR(Number(it.unitPrice))}</p>
                </div>
                <p className="text-sm font-semibold text-charcoal">{formatINR(Number(it.lineTotal))}</p>
              </li>
            );
          })}
        </ul>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-brand-muted">Subtotal</dt><dd>{formatINR(Number(order.subtotal))}</dd></div>
          <div className="flex justify-between"><dt className="text-brand-muted">Shipping / fees</dt><dd>{formatINR(Number(order.shipping))}</dd></div>
          <div className="flex justify-between border-t border-brand-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatINR(Number(order.total))}</dd></div>
        </dl>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-brand-line bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Delivery address (snapshot)</h3>
          <p className="mt-2 text-sm font-semibold text-charcoal">{addr.name}</p>
          <p className="text-sm text-charcoal/80">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
          <p className="text-sm text-charcoal/80">{addr.city}, {addr.state} — {addr.pincode}</p>
          <p className="mt-1 text-xs text-brand-muted">Mobile: {addr.phone}</p>
        </div>

        <div className="rounded-xl border border-brand-line bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Payment</h3>
          {order.payments.map((p) => (
            <p key={p.id} className="mt-2 text-sm text-charcoal">
              {p.provider} · <span className="text-brand-muted">status</span> {p.status} · {formatINR(Number(p.amount))}
            </p>
          ))}
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-gold-deep">Status history</h3>
          <ol className="mt-2 space-y-2 text-sm">
            {order.history.map((h) => (
              <li key={h.id} className="flex items-start gap-2 text-charcoal/80">
                <span className="rounded bg-champagne/60 px-2 py-0.5 text-[10px] font-semibold uppercase">{h.toStatus}</span>
                <span className="text-xs text-brand-muted">{new Date(h.createdAt).toLocaleString("en-IN")}</span>
                {h.reason && <span className="text-xs text-brand-muted">— {h.reason}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="text-xs text-brand-muted">
        <Link href="/account/orders" className="underline underline-offset-2">← Back to orders</Link>
      </p>
    </section>
  );
}
