"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { saveCoupon } from "@/lib/admin/coupons";

type Values = {
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
};

export function CouponForm({ id, initial }: { id?: string; initial?: Partial<Values> }) {
  const router = useRouter();
  const [v, setV] = useState<Values>({
    code: initial?.code ?? "",
    description: initial?.description ?? "",
    type: (initial?.type as "FLAT" | "PERCENT") ?? "PERCENT",
    value: initial?.value ?? 10,
    minOrder: initial?.minOrder ?? null,
    maxDiscount: initial?.maxDiscount ?? null,
    perUserLimit: initial?.perUserLimit ?? null,
    globalLimit: initial?.globalLimit ?? null,
    startsAt: initial?.startsAt ?? null,
    endsAt: initial?.endsAt ?? null,
    isActive: initial?.isActive ?? true,
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const r = await saveCoupon(id ?? null, {
        code: v.code.toUpperCase(),
        description: v.description || undefined,
        type: v.type,
        value: v.value,
        minOrder: v.minOrder ?? undefined,
        maxDiscount: v.maxDiscount ?? undefined,
        perUserLimit: v.perUserLimit ?? undefined,
        globalLimit: v.globalLimit ?? undefined,
        startsAt: v.startsAt ?? undefined,
        endsAt: v.endsAt ?? undefined,
        isActive: v.isActive,
      });
      if (!r.ok) return setErr(r.error);
      router.push("/admin/coupons");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4" noValidate>
      <section className="rounded-xl border border-brand-line bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField id="code" label="Code">
            <input id="code" className={inputCls} required value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} />
          </FormField>
          <FormField id="type" label="Type">
            <select id="type" className={inputCls} value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as "FLAT" | "PERCENT" })}>
              <option value="PERCENT">Percentage %</option>
              <option value="FLAT">Flat ₹</option>
            </select>
          </FormField>
          <FormField id="value" label={v.type === "PERCENT" ? "Discount %" : "Discount ₹"}>
            <input id="value" type="number" min={0} className={inputCls} value={v.value} onChange={(e) => setV({ ...v, value: Number(e.target.value) })} />
          </FormField>
          <FormField id="max" label="Max discount ₹ (percent only)">
            <input id="max" type="number" min={0} className={inputCls} value={v.maxDiscount ?? ""} onChange={(e) => setV({ ...v, maxDiscount: e.target.value === "" ? null : Number(e.target.value) })} />
          </FormField>
          <FormField id="min" label="Minimum order ₹">
            <input id="min" type="number" min={0} className={inputCls} value={v.minOrder ?? ""} onChange={(e) => setV({ ...v, minOrder: e.target.value === "" ? null : Number(e.target.value) })} />
          </FormField>
          <FormField id="perUser" label="Per user limit">
            <input id="perUser" type="number" min={1} className={inputCls} value={v.perUserLimit ?? ""} onChange={(e) => setV({ ...v, perUserLimit: e.target.value === "" ? null : Number(e.target.value) })} />
          </FormField>
          <FormField id="global" label="Global usage limit">
            <input id="global" type="number" min={1} className={inputCls} value={v.globalLimit ?? ""} onChange={(e) => setV({ ...v, globalLimit: e.target.value === "" ? null : Number(e.target.value) })} />
          </FormField>
          <FormField id="start" label="Starts at">
            <input id="start" type="datetime-local" className={inputCls} value={v.startsAt?.slice(0, 16) ?? ""} onChange={(e) => setV({ ...v, startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </FormField>
          <FormField id="end" label="Ends at">
            <input id="end" type="datetime-local" className={inputCls} value={v.endsAt?.slice(0, 16) ?? ""} onChange={(e) => setV({ ...v, endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </FormField>
        </div>
        <FormField id="description" label="Description (shown in admin)">
          <input id="description" className={inputCls} maxLength={200} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} /> Active
        </label>
      </section>

      {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">{err}</div>}

      <div><Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : id ? "Save changes" : "Create coupon"}</Button></div>
    </form>
  );
}
