import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { ImportClient } from "./ImportClient";

export default function ImportPage() {
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
