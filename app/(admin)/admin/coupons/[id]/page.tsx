import { notFound } from "next/navigation";
import { AdminPageHeader, Crumb } from "@/components/admin/AdminPageHeader";
import { CouponForm } from "@/components/admin/CouponForm";
import { getCouponForEdit } from "@/lib/admin/coupons";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const c = await getCouponForEdit(id);
  if (!c) notFound();
  return (
    <div className="space-y-5">
      <div>
        <Crumb items={[{ label: "Coupons", href: "/admin/coupons" }, { label: c.code }]} />
        <AdminPageHeader title={c.code} />
      </div>
      <CouponForm
        id={c.id}
        initial={{
          code: c.code,
          description: c.description,
          type: c.type,
          value: Number(c.value),
          minOrder: c.minOrder ? Number(c.minOrder) : null,
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
          perUserLimit: c.perUserLimit,
          globalLimit: c.globalLimit,
          startsAt: c.startsAt?.toISOString() ?? null,
          endsAt: c.endsAt?.toISOString() ?? null,
          isActive: c.isActive,
        }}
      />
    </div>
  );
}
