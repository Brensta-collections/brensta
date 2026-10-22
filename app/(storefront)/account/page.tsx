import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export default async function AccountOverview() {
  const user = await requireUser();
  const [orderCount, addressCount, wishlistCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.wishlist.count({ where: { userId: user.id } }),
  ]);

  const stats = [
    { label: "Orders", value: orderCount, href: "/account/orders" },
    { label: "Addresses", value: addressCount, href: "/account/addresses" },
    { label: "Wishlist", value: wishlistCount, href: "/wishlist" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-brand-line bg-white p-6">
        <h2 className="brand-wordmark text-xl text-charcoal">Welcome, {user.name ?? "there"}</h2>
        <p className="mt-1 text-sm text-brand-muted">Manage your profile, orders and addresses here.</p>
        <dl className="mt-6 grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="rounded-lg border border-brand-line bg-ivory p-4 text-center hover:border-gold">
              <dt className="text-xs uppercase tracking-wider text-brand-muted">{s.label}</dt>
              <dd className="brand-wordmark mt-1 text-2xl text-gold-deep">{s.value}</dd>
            </Link>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-deep">Quick links</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          <li><Link href="/account/profile" className="text-sm text-charcoal hover:text-gold-deep">Edit profile</Link></li>
          <li><Link href="/account/addresses/new" className="text-sm text-charcoal hover:text-gold-deep">Add a new address</Link></li>
          <li><Link href="/account/orders" className="text-sm text-charcoal hover:text-gold-deep">View recent orders</Link></li>
          <li><Link href="/account/change-password" className="text-sm text-charcoal hover:text-gold-deep">Change password</Link></li>
        </ul>
      </section>
    </div>
  );
}
