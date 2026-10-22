import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { productDisplayPrice, totalStock } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductActions } from "@/components/cart/AddToCartButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug }, select: { name: true, seoTitle: true, seoDescription: true, shortDescription: true } });
  if (!p) return { title: "Not found" };
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDescription ?? p.shortDescription ?? undefined,
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
  const related = await getRelatedProducts(product.id, categoryIds, 4);

  const breadcrumbs = primaryCat
    ? [{ name: primaryCat.category.name, href: `/c${primaryCat.category.path}` }, { name: product.name }]
    : [{ name: product.name }];

  const variantsForClient = product.variants.map((v) => ({
    id: v.id,
    stock: v.stock,
    optionValues: v.optionValues as Record<string, string>,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <ProductGallery productSlug={product.slug} productName={product.name} images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Badge variant="demo">DEMO</Badge>
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
              <ProductCard key={p.id} product={p} />
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
