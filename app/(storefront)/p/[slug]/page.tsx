import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { productDisplayPrice, totalStock } from "@/lib/pricing";
import { getWishlistProductIds } from "@/lib/wishlist";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductActions } from "@/components/cart/AddToCartButton";
import { JsonLd } from "@/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug }, select: { name: true, seoTitle: true, seoDescription: true, shortDescription: true } });
  if (!p) return { title: "Not found" };
  const rawTitle = p.seoTitle ?? p.name;
  // Some seeded products store seoTitle as "<name> | BRENSTA" already. The root template
  // then produces "… | BRENSTA | BRENSTA". When the raw title already carries the brand
  // name, bypass the template with { absolute: … }. Open Graph has no template so it
  // can safely use the raw string either way.
  const title = /brensta/i.test(rawTitle) ? { absolute: rawTitle } : rawTitle;
  return {
    title,
    description: p.seoDescription ?? p.shortDescription ?? undefined,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title: rawTitle,
      description: p.seoDescription ?? p.shortDescription ?? undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "PUBLISHED") notFound();

  const price = productDisplayPrice(product, product.variants);
  const stock = totalStock(product.variants);
  const primaryCat = product.categories.find((c) => c.isPrimary) ?? product.categories[0];
  const categoryIds = product.categories.map((c) => c.categoryId);
  const [related, wishlistIds] = await Promise.all([
    getRelatedProducts(product.id, categoryIds, 4),
    getWishlistProductIds(),
  ]);

  const breadcrumbs = primaryCat
    ? [{ name: primaryCat.category.name, href: `/c${primaryCat.category.path}` }, { name: product.name }]
    : [{ name: product.name }];

  const variantsForClient = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    stock: v.stock,
    optionValues: v.optionValues as Record<string, string>,
  }));
  const hasRealImage = product.images.some((i) => !i.url.startsWith("placeholder:"));

  const canonicalUrl = `${SITE_URL}/p/${product.slug}`;
  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: product.brand },
    description: product.shortDescription ?? product.description ?? undefined,
    url: canonicalUrl,
    ...(hasRealImage
      ? { image: product.images.filter((i) => !i.url.startsWith("placeholder:")).map((i) => (i.url.startsWith("/") ? SITE_URL + i.url : i.url)) }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: price.price,
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    },
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      ...(primaryCat ? [{ "@type": "ListItem" as const, position: 2, name: primaryCat.category.name, item: `${SITE_URL}/c${primaryCat.category.path}` }] : []),
      { "@type": "ListItem", position: primaryCat ? 3 : 2, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <JsonLd data={productLd} />
      <JsonLd data={crumbLd} />
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <ProductGallery productSlug={product.slug} productName={product.name} images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            {!hasRealImage && <Badge variant="demo">DEMO</Badge>}
            {price.onSale && <Badge variant="sale">Sale</Badge>}
            {product.isNewArrival && <Badge variant="new">New</Badge>}
            {stock === 0 && <Badge variant="soldout">Sold Out</Badge>}
          </div>
          <h1 className="brand-wordmark mt-3 text-3xl text-charcoal md:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <Price price={price.price} list={price.list} onSale={price.onSale} size="lg" />
            <p className="mt-1 text-xs text-brand-muted">Inclusive of all taxes</p>
          </div>

          {product.shortDescription && <p className="mt-5 text-sm text-charcoal/80">{product.shortDescription}</p>}

          {product.attributeValues.length > 0 && (
            <ul className="mt-5 grid grid-cols-1 gap-y-1 text-sm text-brand-muted sm:grid-cols-2">
              {product.attributeValues.map((av) => {
                const v = av.valueOption ?? av.valueText ?? (av.valueNumber !== null ? String(av.valueNumber) : null) ?? (av.valueBool !== null ? (av.valueBool ? "Yes" : "No") : null);
                if (!v) return null;
                return (
                  <li key={av.id} className="flex gap-2">
                    <span className="text-charcoal">{av.attribute.name}:</span> {v}{av.attribute.unit ? ` ${av.attribute.unit}` : ""}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-8">
            <ProductActions productId={product.id} productName={product.name} variants={variantsForClient} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-brand-line pt-6 text-xs text-charcoal/80 sm:grid-cols-3">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold-deep" /> Delivery 5–7 days</div>
            <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-gold-deep" /> Easy 7-day return</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold-deep" /> Secure payments</div>
          </div>
        </div>
      </div>

      {product.description && (
        <section className="mt-16 border-t border-brand-line pt-10">
          <h2 className="brand-wordmark text-2xl text-charcoal">Description</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-charcoal/80">{product.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="brand-wordmark text-2xl text-charcoal">You May Also Like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} inWishlist={wishlistIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-brand-muted">
        <Link href="/shop" className="underline-offset-4 hover:underline">← Back to shop</Link>
      </p>
    </div>
  );
}
