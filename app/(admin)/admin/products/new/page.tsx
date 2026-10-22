import { prisma } from "@/lib/db";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, attributeDefs] = await Promise.all([
    prisma.category.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true, path: true }, orderBy: { path: "asc" } }),
    prisma.attributeDefinition.findMany({ select: { id: true, code: true, name: true, type: true, options: true } }),
  ]);
  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Products", href: "/admin/products" }, { label: "New" }]} />
        <AdminPageHeader title="New product" subtitle="Create and publish a BRENSTA product." />
      </div>
      <ProductForm categories={categories} attributeDefs={attributeDefs} />
    </div>
  );
}
