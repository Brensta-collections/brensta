import Link from "next/link";
import { Package } from "lucide-react";
import { listMyOrders } from "@/lib/orders";
import { formatINR } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-champagne text-charcoal",
  CONFIRMED: "bg-gold/30 text-gold-deep",
  PROCESSING: "bg-gold/30 text-gold-deep",
  SHIPPED: "bg-gold-deep text-ivory",
  DELIVERED: "bg-charcoal text-ivory",
  CANCELLED: "bg-brand-muted/40 text-charcoal",
  RETURNED: "bg-brand-muted/40 text-charcoal",
  REFUNDED: "bg-brand-muted/40 text-charcoal",
};

export default async function OrdersPage() {
  const orders = await listMyOrders();
  return (
    <section className="rounded-xl border border-brand-line bg-white p-6">
      <h2 className="brand-wordmark text-xl text-charcoal">My Orders</h2>
      <p className="mt-1 text-sm text-brand-muted">All your BRENSTA orders in one place.</p>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Explore the shop and place your first order." cta={{ label: "Shop", href: "/shop" }} icon={<Package className="h-6 w-6" />} />
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded-xl border border-brand-line bg-ivory p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-brand-muted">#{o.number}</p>
                    <p className="text-sm text-charcoal">Placed {new Date(o.placedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLORS[o.status] ?? "bg-champagne text-charcoal"}`}>
                    {o.status}
                  </span>
                </div>
                <ul className="mt-3 flex -space-x-2">
                  {o.items.slice(0, 4).map((it) => {
                    const placeholder = !it.imageSnapshot || it.imageSnapshot.startsWith("placeholder:");
                    return (
                      <li key={it.id} className="h-12 w-12 overflow-hidden rounded-full border-2 border-ivory bg-champagne/30">
                        {placeholder ? (
                          <PlaceholderImage seed={it.id} label={it.nameSnapshot} aspect="square" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.imageSnapshot!} alt={it.nameSnapshot} className="h-full w-full object-cover" />
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-charcoal">{o.items.reduce((s, i) => s + i.qty, 0)} items · {formatINR(Number(o.total))}</p>
                  <Link href={`/account/orders/${o.number}`} className="text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal">
                    View details →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
