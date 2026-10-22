"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { updateProfile } from "@/lib/profile";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, setState] = useState({ name, phone });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await updateProfile(state);
      if (r.ok) setMsg("Profile updated.");
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4" noValidate>
      <FormField id="name" label="Full name">
        <input id="name" className={inputCls} value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} required />
      </FormField>
      <FormField id="email" label="Email">
        <input id="email" className={inputCls} value={email} readOnly aria-readonly disabled />
      </FormField>
      <FormField id="phone" label="Mobile" hint="10-digit Indian mobile number.">
        <input id="phone" className={inputCls} inputMode="numeric" maxLength={10} value={state.phone} onChange={(e) => setState({ ...state, phone: e.target.value.replace(/\D/g, "") })} />
      </FormField>
      {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">{err}</div>}
      {msg && <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-deep">{msg}</div>}
      <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
