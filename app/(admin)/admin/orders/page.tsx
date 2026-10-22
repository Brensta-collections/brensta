import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listAdminOrders } from "@/lib/admin/orders";
import { formatINR } from "@/lib/utils";
import { Pagination } from "@/components/storefront/Pagination";
import { OrderFilters } from "./OrderFilters";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = (sp.status as "ALL" | "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED" | undefined) ?? "ALL";
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const { items, total, pages } = await listAdminOrders({ q, status, from: from || undefined, to: to || undefined, page });

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Orders" subtitle={`${total} total`} />
      <OrderFilters q={q} status={status} from={from} to={to} />
      <div className="overflow-hidden rounded-xl border border-brand-line bg-white">
        <table className="min-w-full divide-y divide-brand-line">
          <thead className="bg-ivory text-left text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line text-sm">
            {items.map((o) => (
              <tr key={o.id} className="hover:bg-ivory/50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/admin/orders/${o.number}`} className="font-mono text-xs text-gold-deep hover:underline">#{o.number}</Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{new Date(o.placedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-charcoal">{o.user?.name ?? "—"}</p>
                  <p className="text-[11px] text-brand-muted">{o.email}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-brand-muted">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatINR(Number(o.total))}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">
                  {o.payments[0]?.provider ?? "—"} · {o.payments[0]?.status ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full bg-champagne px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal">{o.status}</span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-muted">No orders match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pathname="/admin/orders" searchParams={sp} page={page} pages={pages} />
    </div>
  );
}
