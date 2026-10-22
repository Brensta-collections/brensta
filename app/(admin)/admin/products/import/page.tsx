import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { ImportClient } from "./ImportClient";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function ImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Products", href: "/admin/products" }, { label: "Import / Export" }]} />
        <AdminPageHeader title="Import / Export products" subtitle="CSV format: name, slug, sku, category_path, base_price, stock" />
      </div>
      <ImportClient />
    </div>
  );
}
