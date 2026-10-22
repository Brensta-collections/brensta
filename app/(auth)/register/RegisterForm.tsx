"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { registerSchema } from "@/lib/validators/auth";

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse({
      name: state.name,
      email: state.email,
      phone: state.phone || undefined,
      password: state.password,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setLoading(false);
      setError(json.error ?? "Could not create account.");
      return;
    }
    // Auto sign-in
    const signInRes = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    setLoading(false);
    if (!signInRes || signInRes.error) {
      router.push("/login");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField id="name" label="Full name">
        <input id="name" required value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} className={inputCls} />
      </FormField>
      <FormField id="email" label="Email">
        <input id="email" type="email" autoComplete="email" required value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })} className={inputCls} />
      </FormField>
      <FormField id="phone" label="Mobile" hint="Optional. 10-digit Indian mobile.">
        <input id="phone" type="tel" inputMode="numeric" maxLength={10} value={state.phone} onChange={(e) => setState({ ...state, phone: e.target.value.replace(/\D/g, "") })} className={inputCls} />
      </FormField>
      <FormField id="password" label="Password" hint="Minimum 10 characters with letters and numbers.">
        <input id="password" type="password" autoComplete="new-password" required value={state.password} onChange={(e) => setState({ ...state, password: e.target.value })} className={inputCls} />
      </FormField>

      {error && (
        <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-[11px] text-brand-muted">
        By continuing you accept our <Link href="/p/policies/terms" className="underline underline-offset-2">Terms</Link> and <Link href="/p/policies/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}
