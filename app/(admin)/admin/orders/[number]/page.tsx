import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { getAdminOrder } from "@/lib/admin/orders";
import { formatINR } from "@/lib/utils";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { OrderStatusPanel } from "./OrderStatusPanel";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function AdminOrderDetail({ params }: { params: Promise<{ number: string }> }) {
  await requireAdmin();

  const { number } = await params;
  const order = await getAdminOrder(number);
  if (!order) notFound();
  const addr = order.shippingAddress as { name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string };

  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Orders", href: "/admin/orders" }, { label: `#${order.number}` }]} />
        <AdminPageHeader title={`Order #${order.number}`} subtitle={`Placed ${new Date(order.placedAt).toLocaleString("en-IN")}`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h2 className="brand-wordmark text-lg text-charcoal">Items</h2>
            <ul className="mt-3 divide-y divide-brand-line border-t border-brand-line">
              {order.items.map((it) => {
                const placeholder = !it.imageSnapshot || it.imageSnapshot.startsWith("placeholder:");
                const attrs = it.attributesSnapshot as Record<string, string> | null;
                const label = attrs ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(" · ") : "";
                return (
                  <li key={it.id} className="flex items-start gap-4 py-3">
                    <div className="h-14 w-14 overflow-hidden rounded border border-brand-line bg-champagne/30">
                      {placeholder ? <PlaceholderImage seed={it.id} label={it.nameSnapshot} aspect="square" /> : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.imageSnapshot!} alt={it.nameSnapshot} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{it.nameSnapshot}</p>
                      <p className="text-[11px] text-brand-muted">SKU {it.skuSnapshot}{label ? ` · ${label}` : ""}</p>
                      <p className="text-[11px] text-brand-muted">Qty {it.qty} × {formatINR(Number(it.unitPrice))}</p>
                    </div>
                    <p className="font-semibold">{formatINR(Number(it.lineTotal))}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-brand-muted">Subtotal</dt><dd>{formatINR(Number(order.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-muted">Shipping / fees</dt><dd>{formatINR(Number(order.shipping))}</dd></div>
              <div className="flex justify-between border-t border-brand-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatINR(Number(order.total))}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h2 className="brand-wordmark text-lg text-charcoal">Status history</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex items-start gap-2">
                  <span className="rounded bg-champagne/60 px-2 py-0.5 text-[10px] font-semibold uppercase">{h.toStatus}</span>
                  <span className="text-xs text-brand-muted">{new Date(h.createdAt).toLocaleString("en-IN")}</span>
                  {h.byUser && <span className="text-xs text-brand-muted">by {h.byUser.name ?? h.byUser.email}</span>}
                  {h.reason && <span className="text-xs text-brand-muted">— {h.reason}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <OrderStatusPanel orderId={order.id} status={order.status} />
          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Customer</h3>
            <p className="mt-2 text-sm font-semibold text-charcoal">{order.user?.name ?? "Guest"}</p>
            <p className="text-xs text-brand-muted">{order.email}</p>
            <p className="text-xs text-brand-muted">{order.phone}</p>
            {order.user && <Link href={`/admin/customers/${order.user.id}`} className="mt-2 inline-block text-xs text-gold-deep underline underline-offset-4">View customer →</Link>}
          </section>
          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Shipping address (snapshot)</h3>
            <p className="mt-2 text-sm font-semibold text-charcoal">{addr.name}</p>
            <p className="text-sm text-charcoal/80">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
            <p className="text-sm text-charcoal/80">{addr.city}, {addr.state} — {addr.pincode}</p>
          </section>
          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Payment</h3>
            {order.payments.map((p) => (
              <p key={p.id} className="mt-2 text-sm text-charcoal">{p.provider} · {p.status} · {formatINR(Number(p.amount))}</p>
            ))}
          </section>
          {order.shipments.length > 0 && (
            <section className="rounded-xl border border-brand-line bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Shipment</h3>
              {order.shipments.map((s) => (
                <p key={s.id} className="mt-2 text-sm text-charcoal">
                  {s.courier ?? "—"} · {s.trackingNumber ?? "—"} · {s.status}
                </p>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
