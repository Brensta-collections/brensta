import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const mainCategories = await prisma.category.findMany({
    where: { parentId: null, status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      {/* Header */}
      <header className="border-b border-brand-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="brand-wordmark text-2xl font-semibold text-gold-deep">
            BRENSTA
          </Link>
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            {mainCategories.map((c) => (
              <Link key={c.id} href={`/c${c.path}`} className="hover:text-gold-deep">
                {c.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-sm text-brand-muted">
            <Link href="/login" className="hover:text-charcoal">Login</Link>
            <Link href="/cart" className="hover:text-charcoal">Cart</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-champagne/40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold-deep">BRENSTA</p>
            <h1 className="brand-wordmark mt-4 text-5xl leading-tight text-charcoal md:text-6xl">
              Jewellery for<br />Every You
            </h1>
            <p className="mt-6 max-w-md text-brand-muted">
              Elegant · Trendy · Timeless. A premium women&apos;s fashion &amp; lifestyle destination —
              jewellery, clothing, bags, accessories and footwear.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-block rounded-full bg-charcoal px-8 py-3 text-sm font-medium text-ivory hover:bg-warm-brown"
            >
              Shop Now
            </Link>
          </div>
          <div className="flex h-80 items-center justify-center rounded-lg border border-brand-line bg-ivory text-sm text-brand-muted">
            [ hero image placeholder — add in Milestone 3 ]
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="brand-wordmark text-3xl text-charcoal">Shop by Category</h2>
        <p className="mt-2 text-sm text-brand-muted">
          {mainCategories.length} main categories ·{" "}
          {mainCategories.reduce((sum, c) => sum + c.children.length, 0)} subcategories — all managed from the admin dashboard.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-5">
          {mainCategories.map((c) => (
            <Link
              key={c.id}
              href={`/c${c.path}`}
              className="group block overflow-hidden rounded-lg border border-brand-line bg-white p-6 text-center transition hover:border-gold hover:shadow-sm"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-champagne/60 text-gold-deep">
                <span className="brand-wordmark text-xl">{c.name[0]}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-charcoal group-hover:text-gold-deep">
                {c.name}
              </h3>
              <p className="mt-1 text-xs text-brand-muted">{c.children.length} subcategories</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Subcategory peek — demonstrates DB-driven navigation */}
      <section className="bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="brand-wordmark text-2xl text-charcoal">Browse Subcategories</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-5">
            {mainCategories.map((c) => (
              <div key={c.id}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{c.name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {c.children.map((sub) => (
                    <li key={sub.id}>
                      <Link href={`/c${sub.path}`} className="text-brand-muted hover:text-charcoal">
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-line">
        <div className="mx-auto max-w-7xl px-6 py-10 text-center text-xs text-brand-muted">
          <p className="brand-wordmark text-lg text-gold-deep">BRENSTA</p>
          <p className="mt-2">Jewellery for Every You</p>
          <p className="mt-6">
            <span className="rounded border border-brand-line bg-ivory px-2 py-1 font-mono text-[10px] uppercase">
              Dev build — Milestone 2
            </span>
          </p>
          <p className="mt-4">© {new Date().getFullYear()} BRENSTA · All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
