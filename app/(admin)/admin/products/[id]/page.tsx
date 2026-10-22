import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminProduct } from "@/lib/admin/products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, attributeDefs] = await Promise.all([
    getAdminProduct(id),
    prisma.category.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true, path: true }, orderBy: { path: "asc" } }),
    prisma.attributeDefinition.findMany({ select: { id: true, code: true, name: true, type: true, options: true } }),
  ]);
  if (!product) notFound();

  const primary = product.categories.find((c) => c.isPrimary) ?? product.categories[0];
  const initial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    brand: product.brand,
    basePrice: Number(product.basePrice),
    baseSalePrice: product.baseSalePrice ? Number(product.baseSalePrice) : null,
    taxRatePct: product.taxRatePct ? Number(product.taxRatePct) : null,
    status: product.status,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    categoryIds: product.categories.map((c) => c.category.id),
    primaryCategoryId: primary?.category.id ?? "",
    attributeValues: product.attributeValues.map((av) => ({
      code: av.attribute.code,
      value: av.valueOption ?? av.valueText ?? (av.valueNumber !== null ? String(av.valueNumber) : null) ?? (av.valueBool !== null ? String(av.valueBool) : "") ?? "",
    })).filter((a) => a.value),
    variants: product.variants.map((vv) => ({
      id: vv.id,
      sku: vv.sku,
      price: Number(vv.price),
      salePrice: vv.salePrice ? Number(vv.salePrice) : null,
      stock: vv.stock,
      lowStockThreshold: vv.lowStockThreshold,
      optionValues: vv.optionValues as Record<string, string>,
      isActive: vv.isActive,
    })),
    images: product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, sortOrder: i.sortOrder })),
  };

  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Products", href: "/admin/products" }, { label: product.name }]} />
        <AdminPageHeader title={product.name} subtitle={`Slug: ${product.slug} · Status: ${product.status}`} />
      </div>
      <ProductForm initial={initial} categories={categories} attributeDefs={attributeDefs} />
    </div>
  );
}
