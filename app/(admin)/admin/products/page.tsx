import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminProducts } from "@/lib/admin/products";
import { LinkButton } from "@/components/ui/LinkButton";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductRowActions } from "./ProductRowActions";
import { productDisplayPrice, totalStock } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { ProductFilters } from "./ProductFilters";
import { Pagination } from "@/components/storefront/Pagination";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = (sp.status as "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED" | "ALL" | undefined) ?? "ALL";
  const stock = (sp.stock as "low" | "out" | "all" | undefined) ?? "all";
  const categoryId = typeof sp.categoryId === "string" ? sp.categoryId : undefined;
  const page = Math.max(1, Number(sp.page ?? 1));

  const [{ items, total, pages }, categoryOptions] = await Promise.all([
    listAdminProducts({ q, status, stock, categoryId, page }),
    prisma.category.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true, path: true }, orderBy: { path: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Products" subtitle={`${total} total`}>
        <LinkButton href="/admin/products/import" variant="outline" size="sm">Import / Export</LinkButton>
        <LinkButton href="/admin/products/new" variant="primary" size="sm"><Plus className="h-4 w-4" /> Add product</LinkButton>
      </AdminPageHeader>

      <ProductFilters q={q} status={status} stock={stock} categoryId={categoryId} categories={categoryOptions} />

      {/* overflow-x-auto turns the table into a deliberate horizontal-scroll
          region on narrow viewports instead of clipping cells or pushing the
          page's siblings off-screen. */}
      <div className="overflow-x-auto rounded-xl border border-brand-line bg-white">
        <table className="min-w-full divide-y divide-brand-line">
          <thead className="bg-ivory">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line text-sm">
            {items.map((p) => {
              const price = productDisplayPrice(p, p.variants);
              const stockN = totalStock(p.variants);
              const primary = p.categories[0]?.category;
              const img = p.images[0];
              const placeholder = !img || img.url.startsWith("placeholder:");
              return (
                <tr key={p.id} className="hover:bg-ivory/50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-brand-line bg-champagne/30">
                        {placeholder ? (
                          <PlaceholderImage seed={p.slug} label={p.name} aspect="square" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium text-charcoal hover:text-gold-deep">
                          {p.name}
                        </Link>
                        <p className="font-mono text-[10px] text-brand-muted">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{primary?.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3"><Price price={price.price} list={price.list} onSale={price.onSale} size="sm" /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`text-xs ${stockN === 0 ? "text-warm-brown" : stockN <= 5 ? "text-gold-deep" : "text-charcoal"}`}>{stockN}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge variant={p.status === "PUBLISHED" ? "new" : p.status === "DRAFT" ? "neutral" : "soldout"}>{p.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <ProductRowActions id={p.id} slug={p.slug} status={p.status} />
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-muted">No products match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pathname="/admin/products" searchParams={sp} page={page} pages={pages} />
    </div>
  );
}
