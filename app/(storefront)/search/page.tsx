import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SortSelect } from "@/components/storefront/SortSelect";
import { Pagination } from "@/components/storefront/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { pluralize } from "@/lib/utils";
import { SearchForm } from "./SearchForm";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort = (sp.sort as string) ?? "popularity";
  const page = Math.max(1, Number(sp.page ?? 1));

  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Search</p>
        <h1 className="brand-wordmark mt-1 text-3xl text-charcoal md:text-4xl">Search BRENSTA</h1>
        <p className="mt-1 text-sm text-brand-muted">Try jewellery, saree, tote, sunglasses…</p>
        <SearchForm defaultQ="" className="mt-6" />
        <div className="mt-10">
          <EmptyState title="Nothing to show yet" description="Type a query above or browse the shop." cta={{ label: "Browse all", href: "/shop" }} />
        </div>
      </div>
    );
  }

  const [{ items, total, pages }, wishlistIds] = await Promise.all([
    listProducts({ search: q, sort: sort as "popularity" | "newest" | "price_asc" | "price_desc", page, perPage: 24 }),
    getWishlistProductIds(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Search</p>
          <h1 className="brand-wordmark mt-1 text-3xl text-charcoal md:text-4xl">“{q}”</h1>
          <p className="mt-1 text-sm text-brand-muted">{pluralize(total, "result")}</p>
        </div>
        {total > 0 && <SortSelect current={sort} />}
      </div>

      <SearchForm defaultQ={q} className="mt-6 max-w-2xl" />

      <div className="mt-8">
        <ProductGrid products={items} inWishlistIds={wishlistIds} emptyTitle="No matches" emptyDescription="Try a different term or browse the shop." />
        <Pagination pathname="/search" searchParams={sp} page={page} pages={pages} />
      </div>
    </div>
  );
}
