import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, ShoppingBag, Users, IndianRupee } from "lucide-react";
import { getAdminStats } from "@/lib/admin/stats";
import { formatINR } from "@/lib/utils";

export default async function AdminDashboard() {
  const s = await getAdminStats();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="brand-wordmark text-3xl text-charcoal">Dashboard</h1>
        <p className="text-sm text-brand-muted">A snapshot of your BRENSTA store.</p>
      </header>

      {/* ───── Top cards ───── */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<ShoppingBag className="h-5 w-5" />} label="Orders (all time)" value={String(s.orderCount)} sub={`${s.last30Orders} in last 30 days`} href="/admin/orders" />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Revenue" value={formatINR(s.revenue)} sub={`${formatINR(s.last30Revenue)} in last 30 days`} />
        <StatCard icon={<Package className="h-5 w-5" />} label="Products (live)" value={String(s.productCount)} sub={`${s.draftCount} in draft`} href="/admin/products" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Customers" value={String(s.customerCount)} href="/admin/customers" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* Low stock */}
        <div className="rounded-xl border border-brand-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="brand-wordmark text-lg text-charcoal">Low stock</h2>
            <Link href="/admin/products?stock=low" className="text-[11px] uppercase tracking-wider text-gold-deep hover:text-charcoal">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-brand-muted">All stock healthy.</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-line">
              {s.lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <Link href={`/admin/products?q=${encodeURIComponent(v.product.name)}`} className="font-medium text-charcoal hover:text-gold-deep">
                      {v.product.name}
                    </Link>
                    <p className="font-mono text-[11px] text-brand-muted">{v.sku}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.stock === 0 ? "bg-warm-brown/20 text-warm-brown" : "bg-gold/20 text-gold-deep"}`}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-brand-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="brand-wordmark text-lg text-charcoal">Recent orders</h2>
            <Link href="/admin/orders" className="text-[11px] uppercase tracking-wider text-gold-deep hover:text-charcoal">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-brand-muted">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-line">
              {s.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <Link href={`/admin/orders/${o.number}`} className="font-mono text-[11px] text-gold-deep hover:underline">
                      #{o.number}
                    </Link>
                    <p className="text-xs text-charcoal">{o.user?.name ?? o.user?.email ?? "Guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-charcoal">{formatINR(Number(o.total))}</p>
                    <p className="text-[11px] uppercase tracking-wider text-brand-muted">{o.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {s.pendingReviews > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-charcoal">
          <AlertTriangle className="h-5 w-5 text-gold-deep" />
          <span>
            {s.pendingReviews} review{s.pendingReviews === 1 ? "" : "s"} waiting for moderation.{" "}
            <Link href="/admin/reviews?status=PENDING" className="font-semibold text-gold-deep underline underline-offset-4">Open queue</Link>
          </span>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, href }: { icon: React.ReactNode; label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-brand-line bg-white p-5 transition hover:border-gold">
      <div className="flex items-center gap-2 text-brand-muted">
        <span className="text-gold-deep">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="brand-wordmark mt-3 text-3xl text-charcoal">{value}</p>
      {sub && <p className="mt-1 text-xs text-brand-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
