import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SortSelect } from "@/components/storefront/SortSelect";
import { Pagination } from "@/components/storefront/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort = (sp.sort as string) ?? "popularity";
  const page = Math.max(1, Number(sp.page ?? 1));

  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 md:px-6">
        <EmptyState title="Search BRENSTA" description="Try jewellery, saree, tote, sunglasses…" cta={{ label: "Browse all", href: "/shop" }} />
      </div>
    );
  }

  const { items, total, pages } = await listProducts({ search: q, sort: sort as "popularity" | "newest" | "price_asc" | "price_desc", page, perPage: 24 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Search</p>
          <h1 className="brand-wordmark mt-1 text-3xl text-charcoal md:text-4xl">“{q}”</h1>
          <p className="mt-1 text-sm text-brand-muted">{total} result{total === 1 ? "" : "s"}</p>
        </div>
        {total > 0 && <SortSelect current={sort} />}
      </div>

      <div className="mt-8">
        <ProductGrid products={items} emptyTitle="No matches" emptyDescription="Try a different term or browse the shop." />
        <Pagination pathname="/search" searchParams={sp} page={page} pages={pages} />
      </div>
    </div>
  );
}
