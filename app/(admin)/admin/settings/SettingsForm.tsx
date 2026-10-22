"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { saveSetting } from "@/lib/admin/settings";

export function SettingsForm({ rows }: { rows: Array<{ key: string; value: string }> }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save(key: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await saveSetting(key, values[key] ?? "");
      if (r.ok) setMsg(`${key} saved.`);
    });
  }

  return (
    <div className="grid gap-3">
      {Object.entries(values).map(([key, val]) => (
        <section key={key} className="flex items-end gap-2 rounded-lg border border-brand-line bg-white p-3">
          <FormField id={key} label={key}>
            <input id={key} className={inputCls} value={val} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
          </FormField>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => save(key)}>Save</Button>
        </section>
      ))}
      {msg && <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-deep">{msg}</div>}
    </div>
  );
}
