"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { resetSchema } from "@/lib/validators/auth";

export function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Missing or invalid reset link.");
    if (password !== confirm) return setError("Passwords do not match.");
    const parsed = resetSchema.safeParse({ token, password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Choose a stronger password.");

    setLoading(true);
    const res = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setLoading(false);
    if (!res.ok || !json.ok) return setError(json.error ?? "Reset failed.");
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">
        This link is invalid. Request a new one from the forgot password page.
      </div>
    );
  }

  if (done) {
    return <p className="text-sm text-charcoal">Password updated. Redirecting to sign-in…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField id="password" label="New password" hint="Minimum 10 characters with letters and numbers.">
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </FormField>
      <FormField id="confirm" label="Confirm new password">
        <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
      </FormField>
      {error && (
        <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">{error}</div>
      )}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
