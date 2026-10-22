import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listSettings } from "@/lib/admin/settings";
import { SettingsForm } from "./SettingsForm";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function SettingsPage() {
  await requireAdmin();

  const rows = await listSettings();
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Settings" subtitle="Site-wide contact, shipping and social configuration." />
      <SettingsForm rows={rows.map((r) => ({ key: r.key, value: typeof r.value === "object" ? JSON.stringify(r.value) : String(r.value ?? "") }))} />
    </div>
  );
}
