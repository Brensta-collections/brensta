"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { changePassword } from "@/lib/profile";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (next !== confirm) return setErr("New passwords do not match.");
    startTransition(async () => {
      const r = await changePassword({ current, next });
      if (!r.ok) return setErr(r.error);
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg("Password updated.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4" noValidate>
      <FormField id="current" label="Current password">
        <input id="current" type="password" className={inputCls} required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </FormField>
      <FormField id="next" label="New password" hint="At least 10 characters with letters and numbers.">
        <input id="next" type="password" className={inputCls} required value={next} onChange={(e) => setNext(e.target.value)} />
      </FormField>
      <FormField id="confirm" label="Confirm new password">
        <input id="confirm" type="password" className={inputCls} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </FormField>
      {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">{err}</div>}
      {msg && <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-deep">{msg}</div>}
      <Button type="submit" variant="primary" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button>
    </form>
  );
}
