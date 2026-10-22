import Link from "next/link";
import { ShieldCheck, Sparkles, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { ProductCard } from "@/components/ui/ProductCard";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { getMainCategoriesWithChildren } from "@/lib/categories";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products";

export default async function Home() {
  const [categories, bestSellers, newArrivals] = await Promise.all([
    getMainCategoriesWithChildren(),
    getFeaturedProducts(8),
    getNewArrivals(8),
  ]);

  const trustBar = [
    { icon: ShieldCheck, label: "Premium Quality" },
    { icon: Sparkles, label: "Trendy Designs" },
    { icon: Truck, label: "Secure Payments" },
    { icon: RotateCcw, label: "Easy Returns" },
  ];

  return (
    <div>
      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:gap-16 md:px-6 md:py-20">
          <div className="order-2 md:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">BRENSTA</p>
            <h1 className="brand-wordmark mt-4 text-5xl leading-[1.05] text-charcoal md:text-6xl lg:text-7xl">
              Jewellery for<br />Every You
            </h1>
            <p className="mt-6 max-w-md text-brand-muted">
              Elegant · Trendy · Timeless. A premium destination for women&apos;s jewellery, clothing, bags, accessories and footwear.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/shop">
                <Button variant="primary" size="lg">Shop Now</Button>
              </Link>
              <Link href="/c/jewellery">
                <Button variant="outline" size="lg">Explore Jewellery</Button>
              </Link>
            </div>
          </div>
          <div className="order-1 overflow-hidden rounded-2xl md:order-2">
            <PlaceholderImage seed="hero-brensta-woman" label="BRENSTA" aspect="portrait" className="h-[420px] md:h-[520px]" />
          </div>
        </div>
      </section>

      {/* ───── Trust bar ───── */}
      <section className="border-y border-brand-line bg-white/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
          {trustBar.map((t) => (
            <div key={t.label} className="flex items-center justify-center gap-3 text-sm text-charcoal">
              <t.icon className="h-5 w-5 text-gold-deep" />
              <span className="font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Shop by category ───── */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Shop by Category</h2>
            <p className="mt-1 text-sm text-brand-muted">Curated edits across jewellery, clothing, bags, accessories and footwear.</p>
          </div>
          <Link href="/shop" className="hidden text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal md:block">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
          {categories.map((c) => (
            <CategoryCard key={c.id} name={c.name} path={c.path} subCount={c.children.length} image={c.image} />
          ))}
        </div>
      </section>

      {/* ───── Best Sellers ───── */}
      {bestSellers.length > 0 && (
        <section className="bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
            <div className="flex items-end justify-between">
              <h2 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Best Sellers</h2>
              <Link href="/shop?sort=popularity" className="hidden text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal md:block">
                View all →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── New Arrivals ───── */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <div className="flex items-end justify-between">
            <h2 className="brand-wordmark text-3xl text-charcoal md:text-4xl">New Arrivals</h2>
            <Link href="/shop?sort=newest" className="hidden text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal md:block">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ───── Brand story ───── */}
      <section className="bg-champagne/40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">The BRENSTA Story</p>
            <h2 className="brand-wordmark mt-3 text-3xl text-charcoal md:text-4xl">Crafted for the Modern Woman</h2>
            <p className="mt-4 max-w-md text-sm text-brand-muted">
              BRENSTA brings together refined craftsmanship and contemporary design — thoughtfully priced pieces for every day,
              every occasion, every you.
            </p>
            <Link href="/about" className="mt-6 inline-block">
              <Button variant="outline">Read more</Button>
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <PlaceholderImage seed="story-brensta" label="BRENSTA" aspect="portrait" className="h-[360px]" />
          </div>
        </div>
      </section>
    </div>
  );
}
