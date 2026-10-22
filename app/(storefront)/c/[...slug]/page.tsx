import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCategoryByPath, getBreadcrumbs, getCategoryAndDescendantIds } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SortSelect } from "@/components/storefront/SortSelect";
import { Pagination } from "@/components/storefront/Pagination";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";

type SP = Record<string, string | string[] | undefined>;

function toPath(slug: string[]) {
  return "/" + slug.map((s) => decodeURIComponent(s)).join("/");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = toPath(slug);
  const cat = await prisma.category.findUnique({ where: { path }, select: { name: true, seoTitle: true, seoDescription: true } });
  if (!cat) return { title: "Not found" };
  const rawTitle = cat.seoTitle ?? cat.name;
  // If the configured seoTitle already contains "BRENSTA", bypass the "%s | BRENSTA"
  // template so the brand doesn't appear twice.
  const title = /brensta/i.test(rawTitle) ? { absolute: rawTitle } : rawTitle;
  return {
    title,
    description: cat.seoDescription ?? `Shop ${cat.name} at BRENSTA — premium women's fashion & lifestyle.`,
    alternates: { canonical: `/c${path}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const path = toPath(slug);

  const [category, breadcrumbs, categoryIds] = await Promise.all([
    getCategoryByPath(path),
    getBreadcrumbs(path),
    getCategoryAndDescendantIds(path),
  ]);
  if (!category) notFound();

  // Pull filters from searchParams
  const sort = (sp.sort as string) ?? "popularity";
  const minPrice = sp.min ? Number(sp.min) : undefined;
  const maxPrice = sp.max ? Number(sp.max) : undefined;
  const page = Math.max(1, Number(sp.page ?? 1));

  // Load attribute values dynamically from products in this category
  const attrDefs = category.attributes.map((ca) => ca.attribute);
  const activeAttrValues: Record<string, string[]> = {};
  for (const def of attrDefs) {
    const key = `a_${def.code}`;
    const v = sp[key];
    activeAttrValues[def.code] = Array.isArray(v) ? v : v ? [v] : [];
  }

  // Discover available option values for each attribute (from current catalog)
  const attrValueRows = attrDefs.length
    ? await prisma.productAttributeValue.findMany({
        where: {
          attributeId: { in: attrDefs.map((d) => d.id) },
          valueOption: { not: null },
          product: { status: "PUBLISHED", categories: { some: { categoryId: { in: categoryIds } } } },
        },
        select: { attributeId: true, valueOption: true },
      })
    : [];
  const optionsByAttrId = new Map<string, Set<string>>();
  for (const row of attrValueRows) {
    if (!row.valueOption) continue;
    if (!optionsByAttrId.has(row.attributeId)) optionsByAttrId.set(row.attributeId, new Set());
    optionsByAttrId.get(row.attributeId)!.add(row.valueOption);
  }
  const sidebarAttributes = attrDefs
    .filter((d) => optionsByAttrId.get(d.id)?.size)
    .map((d) => ({
      code: d.code,
      name: d.name,
      type: d.type,
      options: Array.from(optionsByAttrId.get(d.id)!).sort(),
      activeValues: activeAttrValues[d.code] ?? [],
    }));

  // Build product query — honour active attribute filters
  const attrFilterIds = Object.entries(activeAttrValues).filter(([, v]) => v.length);
  let productIdsFromAttrs: string[] | undefined;
  if (attrFilterIds.length) {
    const sets: string[][] = [];
    for (const [code, opts] of attrFilterIds) {
      const def = attrDefs.find((d) => d.code === code);
      if (!def) continue;
      const matchingProducts = await prisma.productAttributeValue.findMany({
        where: { attributeId: def.id, valueOption: { in: opts } },
        select: { productId: true },
      });
      sets.push(matchingProducts.map((m) => m.productId));
    }
    // intersection
    productIdsFromAttrs = sets.length ? sets.reduce((a, b) => a.filter((x) => b.includes(x))) : [];
  }

  const [{ items, total, pages }, wishlistIds] = await Promise.all([
    listProducts({
      categoryIds,
      sort: sort as "popularity" | "newest" | "price_asc" | "price_desc",
      minPrice,
      maxPrice,
      page,
      perPage: 24,
    }),
    getWishlistProductIds(),
  ]);
  const filtered = productIdsFromAttrs ? items.filter((p) => productIdsFromAttrs!.includes(p.id)) : items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Breadcrumbs
        items={breadcrumbs.map((b, i) => ({ name: b.name, href: i < breadcrumbs.length - 1 ? `/c${b.path}` : undefined }))}
      />

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">{category.name}</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {filtered.length === total ? `${total}` : `${filtered.length} / ${total}`} product{total === 1 ? "" : "s"}
            {category.description ? ` · ${category.description}` : ""}
          </p>
        </div>
        <SortSelect current={sort} />
      </div>

      {category.children.length > 0 && (
        <nav className="mt-4 flex flex-wrap gap-2">
          {category.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/c${sub.path}`}
              className="rounded-full border border-brand-line bg-white px-3 py-1 text-xs text-charcoal hover:border-gold hover:text-gold-deep"
            >
              {sub.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <FilterSidebar attributes={sidebarAttributes} minPrice={sp.min as string | undefined} maxPrice={sp.max as string | undefined} />
        <div>
          <ProductGrid products={filtered} inWishlistIds={wishlistIds} />
          <Pagination pathname={`/c${path}`} searchParams={sp} page={page} pages={pages} />
        </div>
      </div>
    </div>
  );
}
