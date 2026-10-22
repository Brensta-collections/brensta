import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listSettings } from "@/lib/admin/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const rows = await listSettings();
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Settings" subtitle="Site-wide contact, shipping and social configuration." />
      <SettingsForm rows={rows.map((r) => ({ key: r.key, value: typeof r.value === "object" ? JSON.stringify(r.value) : String(r.value ?? "") }))} />
    </div>
  );
}
