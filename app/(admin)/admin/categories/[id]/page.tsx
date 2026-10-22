import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategoryForEdit } from "@/lib/admin/categories";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const [cat, parents] = await Promise.all([
    getCategoryForEdit(id),
    prisma.category.findMany({ orderBy: { path: "asc" }, select: { id: true, path: true } }),
  ]);
  if (!cat) notFound();
  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Categories", href: "/admin/categories" }, { label: cat.name }]} />
        <AdminPageHeader title={cat.name} subtitle={cat.path} />
      </div>
      <CategoryForm
        initial={{
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId,
          description: cat.description,
          image: cat.image,
          seoTitle: cat.seoTitle,
          seoDescription: cat.seoDescription,
          status: cat.status,
          showInMenu: cat.showInMenu,
          sortOrder: cat.sortOrder,
        }}
        parents={parents}
      />
    </div>
  );
}
