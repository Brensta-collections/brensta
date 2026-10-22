import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { listAllCategories } from "@/lib/admin/categories";
import { CategoryTree } from "./CategoryTree";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const all = await listAllCategories();
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Categories" subtitle={`${all.length} total · hierarchical, admin-managed`}>
        <Link href="/admin/categories/new"><Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add category</Button></Link>
      </AdminPageHeader>
      <div className="rounded-xl border border-brand-line bg-white p-4">
        <CategoryTree
          nodes={all.map((c) => ({
            id: c.id,
            name: c.name,
            path: c.path,
            depth: c.depth,
            status: c.status,
            parentId: c.parentId,
            sortOrder: c.sortOrder,
            productCount: c._count.products,
            childCount: c._count.children,
          }))}
        />
      </div>
    </div>
  );
}
