"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { INDIAN_STATES } from "@/lib/validators/address";
import { createAddress, updateAddress } from "@/lib/addresses";
import { sanitizeNext } from "@/lib/safe-redirect";

type Values = {
  id?: string;
  label?: string | null;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
};

export function AddressForm({ initial, onSavedHref = "/account/addresses" }: { initial?: Partial<Values>; onSavedHref?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  // When this form is reached via "Add new address" during checkout the URL carries ?next=/checkout.
  // Validate before using so an attacker cannot send the user off-site after save.
  const savedHref = sanitizeNext(params.get("next"), onSavedHref);
  const [v, setV] = useState<Values>({
    id: initial?.id,
    label: initial?.label ?? "",
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const payload = {
        label: v.label || undefined,
        name: v.name,
        phone: v.phone,
        line1: v.line1,
        line2: v.line2 || undefined,
        city: v.city,
        state: v.state as (typeof INDIAN_STATES)[number],
        pincode: v.pincode,
        isDefault: v.isDefault,
      };
      const r = v.id ? await updateAddress(v.id, payload) : await createAddress(payload);
      if (!r.ok) return setErr(r.error);
      router.push(savedHref);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField id="label" label="Label (optional)" hint="e.g. Home, Office">
          <input id="label" className={inputCls} maxLength={40} autoComplete="off" value={v.label ?? ""} onChange={(e) => setV({ ...v, label: e.target.value })} />
        </FormField>
        <FormField id="name" label="Full name">
          <input id="name" className={inputCls} required autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </FormField>
      </div>
      <FormField id="phone" label="Mobile" hint="10-digit Indian mobile starting 6–9">
        <input
          id="phone"
          className={inputCls}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          value={v.phone}
          onChange={(e) => setV({ ...v, phone: e.target.value.replace(/\D/g, "") })}
        />
      </FormField>
      <FormField id="line1" label="Flat / House / Street">
        <input id="line1" className={inputCls} required autoComplete="address-line1" value={v.line1} onChange={(e) => setV({ ...v, line1: e.target.value })} />
      </FormField>
      <FormField id="line2" label="Area / Landmark (optional)">
        <input id="line2" className={inputCls} autoComplete="address-line2" value={v.line2 ?? ""} onChange={(e) => setV({ ...v, line2: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField id="city" label="City">
          <input id="city" className={inputCls} required autoComplete="address-level2" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} />
        </FormField>
        <FormField id="state" label="State">
          <select id="state" className={inputCls} required autoComplete="address-level1" value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField id="pincode" label="PIN code" hint="6-digit PIN, cannot start with 0">
          <input
            id="pincode"
            className={inputCls}
            required
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            value={v.pincode}
            onChange={(e) => setV({ ...v, pincode: e.target.value.replace(/\D/g, "") })}
          />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-charcoal">
        <input type="checkbox" checked={!!v.isDefault} onChange={(e) => setV({ ...v, isDefault: e.target.checked })} />
        Set as default address
      </label>
      {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">{err}</div>}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : v.id ? "Save changes" : "Save address"}</Button>
      </div>
    </form>
  );
}
