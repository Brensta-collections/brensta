"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { forgotSchema } from "@/lib/validators/auth";

export function ForgotForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }
    setLoading(true);
    await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-brand-line bg-champagne/40 px-4 py-5 text-sm text-charcoal">
        <p className="font-medium">If an account exists for that email, a reset link has been generated.</p>
        {emailConfigured ? (
          <p className="mt-2 text-brand-muted">Check your inbox for a message from BRENSTA. The link is valid for 30 minutes.</p>
        ) : (
          <p className="mt-2 text-brand-muted">
            Email delivery is not configured in this environment. The reset link has been printed to the server console for development use.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField id="email" label="Email">
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </FormField>
      {error && (
        <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">
          {error}
        </div>
      )}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
