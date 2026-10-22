import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { getCustomer } from "@/lib/admin/customers";
import { formatINR } from "@/lib/utils";
import { CustomerActions } from "./CustomerActions";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCustomer(id);
  if (!data) notFound();
  const { user, orders, addresses } = data;

  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Customers", href: "/admin/customers" }, { label: user.name ?? user.email }]} />
        <AdminPageHeader title={user.name ?? "Customer"} subtitle={`${user.email} · ${user.role}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h2 className="brand-wordmark text-lg text-charcoal">Orders</h2>
            {orders.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">No orders yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-brand-line border-t border-brand-line">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <Link href={`/admin/orders/${o.number}`} className="font-mono text-xs text-gold-deep hover:underline">#{o.number}</Link>
                      <p className="text-xs text-brand-muted">{new Date(o.placedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(Number(o.total))}</p>
                      <p className="text-[11px] uppercase tracking-wider text-brand-muted">{o.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h2 className="brand-wordmark text-lg text-charcoal">Saved addresses</h2>
            {addresses.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">No saved addresses.</p>
            ) : (
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-lg border border-brand-line bg-ivory p-3 text-sm">
                    <p className="font-semibold text-charcoal">{a.name}{a.label ? ` · ${a.label}` : ""}{a.isDefault && <span className="ml-2 rounded bg-gold/20 px-2 py-0.5 text-[10px] uppercase text-gold-deep">Default</span>}</p>
                    <p className="text-charcoal/80">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                    <p className="text-charcoal/80">{a.city}, {a.state} — {a.pincode}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-brand-line bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Account</h3>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-brand-muted">Email</dt><dd>{user.email}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-muted">Phone</dt><dd>{user.phone ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-muted">Verified</dt><dd>{user.emailVerified ? "Yes" : "No"}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-muted">Role</dt><dd>{user.role}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-muted">Joined</dt><dd>{new Date(user.createdAt).toLocaleDateString("en-IN")}</dd></div>
            </dl>
            <p className="mt-4 text-[10px] text-brand-muted">
              Passwords, hashes and reset tokens are never shown or editable from this view.
            </p>
          </section>
          <CustomerActions userId={user.id} isActive={user.isActive} />
        </aside>
      </div>
    </div>
  );
}
