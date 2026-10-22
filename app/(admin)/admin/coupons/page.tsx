import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { listCoupons } from "@/lib/admin/coupons";
import { EmptyState } from "@/components/ui/EmptyState";
import { CouponRow } from "./CouponRow";

export default async function CouponsPage() {
  const coupons = await listCoupons();
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Coupons" subtitle={`${coupons.length} total`}>
        <Link href="/admin/coupons/new"><Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add coupon</Button></Link>
      </AdminPageHeader>
      {coupons.length === 0 ? (
        <EmptyState title="No coupons yet" cta={{ label: "Create a coupon", href: "/admin/coupons/new" }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-line bg-white">
          <table className="min-w-full divide-y divide-brand-line">
            <thead className="bg-ivory text-left text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type / Value</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Limits</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line text-sm">
              {coupons.map((c) => (
                <CouponRow
                  key={c.id}
                  c={{
                    id: c.id,
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
                    redemptions: c._count.redemptions,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
