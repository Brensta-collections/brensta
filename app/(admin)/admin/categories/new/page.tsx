import { prisma } from "@/lib/db";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function NewCategoryPage() {
  const parents = await prisma.category.findMany({ orderBy: { path: "asc" }, select: { id: true, path: true } });
  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Categories", href: "/admin/categories" }, { label: "New" }]} />
        <AdminPageHeader title="New category" />
      </div>
      <CategoryForm parents={parents} />
    </div>
  );
}
