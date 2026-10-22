import Link from "next/link";
import { Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listCustomers } from "@/lib/admin/customers";
import { Pagination } from "@/components/storefront/Pagination";
import { CustomerFilters } from "./CustomerFilters";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const role = (sp.role as "CUSTOMER" | "STAFF" | "ADMIN" | "ALL" | undefined) ?? "ALL";
  const page = Math.max(1, Number(sp.page ?? 1));
  const { items, total, pages } = await listCustomers({ q, role, page });

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Customers" subtitle={`${total} accounts`} />
      <CustomerFilters q={q} role={role} />
      <div className="overflow-hidden rounded-xl border border-brand-line bg-white">
        <table className="min-w-full divide-y divide-brand-line">
          <thead className="bg-ivory text-left text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line text-sm">
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-ivory/50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/admin/customers/${u.id}`} className="text-charcoal hover:text-gold-deep">{u.name ?? "—"}</Link>
                  <p className="text-[11px] text-brand-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{u.role}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{new Date(u.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{u._count.orders}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${u.isActive ? "bg-gold/20 text-gold-deep" : "bg-warm-brown/20 text-warm-brown"}`}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-brand-muted">No customers match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pathname="/admin/customers" searchParams={sp} page={page} pages={pages} />
      <p className="text-[11px] text-brand-muted"><Search className="inline h-3 w-3" /> Passwords, hashes and reset tokens are never shown here.</p>
    </div>
  );
}
