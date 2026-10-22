import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SortSelect } from "@/components/storefront/SortSelect";
import { Pagination } from "@/components/storefront/Pagination";

export const metadata: Metadata = {
  title: "Shop All",
  alternates: { canonical: "/shop" },
};

export default async function ShopAllPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const sort = (sp.sort as string) ?? "popularity";
  const page = Math.max(1, Number(sp.page ?? 1));
  const [{ items, total, pages }, wishlistIds] = await Promise.all([
    listProducts({ sort: sort as "popularity" | "newest" | "price_asc" | "price_desc", page, perPage: 24 }),
    getWishlistProductIds(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Shop</p>
          <h1 className="brand-wordmark mt-1 text-3xl text-charcoal md:text-4xl">All Products</h1>
          <p className="mt-1 text-sm text-brand-muted">{total} products</p>
        </div>
        <SortSelect current={sort} />
      </div>

      <div className="mt-8">
        <ProductGrid products={items} inWishlistIds={wishlistIds} />
        <Pagination pathname="/shop" searchParams={sp} page={page} pages={pages} />
      </div>
    </div>
  );
}
