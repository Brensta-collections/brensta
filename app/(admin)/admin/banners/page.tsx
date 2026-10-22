import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listBanners } from "@/lib/admin/banners";
import { BannerPanel } from "./BannerPanel";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function BannersPage() {
  await requireAdmin();

  const banners = await listBanners();
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Banners" subtitle="Hero and promo images shown across the storefront." />
      <BannerPanel
        banners={banners.map((b) => ({
          id: b.id, section: b.section, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl,
          ctaText: b.ctaText, ctaUrl: b.ctaUrl, sortOrder: b.sortOrder, isActive: b.isActive,
        }))}
      />
    </div>
  );
}
