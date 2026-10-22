"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { saveSetting } from "@/lib/admin/settings";

type SettingMeta = {
  label: string;
  hint?: string;
  type?: "text" | "email" | "tel" | "url" | "number";
  autoComplete?: string;
};

// Human-readable labels + hints for the fixed set of ALLOWED_KEYS in lib/admin/settings.ts.
// Any key not in this map falls back to a prettified version of the dot-key.
const SETTING_META: Record<string, SettingMeta> = {
  "contact.email": { label: "Support email", hint: "Shown on the contact page and in system emails.", type: "email", autoComplete: "email" },
  "contact.phone": { label: "Support phone", hint: "Public phone number for customer support.", type: "tel", autoComplete: "tel" },
  "contact.whatsapp": { label: "WhatsApp number", hint: "Used for the WhatsApp quick-contact link.", type: "tel", autoComplete: "tel" },
  "contact.address": { label: "Registered address", hint: "Shown in the footer and on legal pages." },
  "contact.gstin": { label: "GSTIN", hint: "Business GST identification number." },
  "social.instagram": { label: "Instagram URL", type: "url", autoComplete: "url" },
  "social.facebook": { label: "Facebook URL", type: "url", autoComplete: "url" },
  "order.numberPrefix": { label: "Order number prefix", hint: "e.g. BRN. Prepended to new order numbers." },
  "shipping.freeThresholdInr": { label: "Free shipping threshold (INR)", hint: "Orders at or above this subtotal ship free.", type: "number" },
  "shipping.flatRateInr": { label: "Flat shipping fee (INR)", hint: "Applied below the free-shipping threshold.", type: "number" },
  "shipping.codFeeInr": { label: "Cash-on-delivery fee (INR)", hint: "Additional fee charged when COD is chosen.", type: "number" },
  "shipping.codEnabled": { label: "Enable Cash on Delivery", hint: "Use true or false." },
};

function fallbackLabel(key: string): string {
  return key
    .split(".")
    .map((part) => part.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function SettingsForm({ rows }: { rows: Array<{ key: string; value: string }> }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save(key: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await saveSetting(key, values[key] ?? "");
      if (r.ok) setMsg(`${SETTING_META[key]?.label ?? fallbackLabel(key)} saved.`);
    });
  }

  return (
    <div className="grid gap-3">
      {Object.entries(values).map(([key, val]) => {
        const meta: SettingMeta = SETTING_META[key] ?? { label: fallbackLabel(key) };
        return (
          <section key={key} className="flex items-end gap-2 rounded-lg border border-brand-line bg-white p-3">
            <FormField id={key} label={meta.label} hint={meta.hint}>
              <input
                id={key}
                className={inputCls}
                type={meta.type ?? "text"}
                autoComplete={meta.autoComplete ?? "off"}
                value={val}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              />
            </FormField>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => save(key)}>Save</Button>
          </section>
        );
      })}
      {msg && <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-deep">{msg}</div>}
    </div>
  );
}
