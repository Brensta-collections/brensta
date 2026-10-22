import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { CouponForm } from "@/components/admin/CouponForm";

export default function NewCouponPage() {
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
