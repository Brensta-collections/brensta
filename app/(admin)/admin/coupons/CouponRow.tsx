"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Edit, Trash2 } from "lucide-react";
import { deleteCoupon } from "@/lib/admin/coupons";

type C = {
  id: string;
  code: string;
  description: string | null;
  type: "FLAT" | "PERCENT";
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  perUserLimit: number | null;
  globalLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  redemptions: number;
};

export function CouponRow({ c }: { c: C }) {
  const [pending, startTransition] = useTransition();
  return (
    <tr className="hover:bg-ivory/50">
      <td className="whitespace-nowrap px-4 py-3">
        <p className="font-mono text-sm font-semibold text-charcoal">{c.code}</p>
        {c.description && <p className="text-[11px] text-brand-muted">{c.description}</p>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        {c.type === "FLAT" ? `₹${c.value} OFF` : `${c.value}% OFF`}
        {c.maxDiscount && c.type === "PERCENT" ? <span className="ml-1 text-[11px] text-brand-muted">(max ₹{c.maxDiscount})</span> : null}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">
        {c.startsAt ? new Date(c.startsAt).toLocaleDateString("en-IN") : "—"} → {c.endsAt ? new Date(c.endsAt).toLocaleDateString("en-IN") : "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">
        min ₹{c.minOrder ?? "—"} · {c.perUserLimit ?? "∞"}/user · {c.globalLimit ?? "∞"} total
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs">{c.redemptions}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${c.isActive ? "bg-gold/20 text-gold-deep" : "bg-brand-muted/30 text-charcoal"}`}>
          {c.isActive ? "Yes" : "No"}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <div className="flex justify-end gap-1 text-brand-muted">
          <Link href={`/admin/coupons/${c.id}`} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => { if (confirm(c.redemptions ? "This coupon has been used — it will be deactivated, not deleted. Continue?" : "Delete this coupon?")) startTransition(() => deleteCoupon(c.id)); }}
            className="rounded p-1.5 hover:bg-warm-brown/10 hover:text-warm-brown"
            aria-label="Delete"
          ><Trash2 className="h-4 w-4" /></button>
        </div>
      </td>
    </tr>
  );
}
