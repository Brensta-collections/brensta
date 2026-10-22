import Link from "next/link";
import { ShieldCheck, Sparkles, Truck, RotateCcw } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { ProductCard } from "@/components/ui/ProductCard";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { HeroArtwork } from "@/components/storefront/HeroArtwork";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMainCategoriesWithChildren } from "@/lib/categories";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function Home() {
  const [categories, bestSellers, newArrivals, wishlistIds] = await Promise.all([
    getMainCategoriesWithChildren(),
    getFeaturedProducts(8),
    getNewArrivals(8),
    getWishlistProductIds(),
  ]);

  const trustBar = [
    { icon: ShieldCheck, label: "Premium Quality" },
    { icon: Sparkles, label: "Trendy Designs" },
    { icon: Truck, label: "Secure Payments" },
    { icon: RotateCcw, label: "Easy Returns" },
  ];

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BRENSTA",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: "Premium women's fashion and lifestyle — jewellery, clothing, bags, accessories, footwear.",
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BRENSTA",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:gap-16 md:px-6 md:py-20">
          <div className="order-2 md:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">BRENSTA</p>
            <h1 className="brand-wordmark mt-4 text-5xl leading-[1.05] text-charcoal md:text-6xl lg:text-7xl">
              Fashion for<br />Every You
            </h1>
            <p className="mt-6 max-w-md text-brand-muted">
              Elegant · Trendy · Timeless. A premium destination for women&apos;s jewellery, clothing, bags, accessories and footwear.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/shop" variant="primary" size="lg">Shop All</LinkButton>
              <LinkButton href="/c/clothing" variant="outline" size="lg">Explore Clothing</LinkButton>
            </div>
          </div>
          <HeroArtwork className="order-1 h-[420px] md:order-2 md:h-[520px]" />
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

      {/* ───── Editor's Picks (admin-curated via isFeatured; renamed from "Best Sellers" until real sales exist) ───── */}
      {bestSellers.length > 0 && (
        <section className="bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Editor&apos;s Picks</h2>
                <p className="mt-1 text-xs text-brand-muted">Hand-picked by our team.</p>
              </div>
              <Link href="/shop?sort=popularity" className="hidden text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal md:block">
                View all →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} inWishlist={wishlistIds.has(p.id)} />
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
              <ProductCard key={p.id} product={p} inWishlist={wishlistIds.has(p.id)} />
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
            <LinkButton href="/about" variant="outline" className="mt-6 inline-block">Read more</LinkButton>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <PlaceholderImage seed="story-brensta" label="BRENSTA" aspect="portrait" className="h-[360px]" />
          </div>
        </div>
      </section>
    </div>
  );
}
