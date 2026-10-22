import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { CouponForm } from "@/components/admin/CouponForm";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function NewCouponPage() {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Coupons", href: "/admin/coupons" }, { label: "New" }]} />
        <AdminPageHeader title="New coupon" />
      </div>
      <CouponForm />
    </div>
  );
}
