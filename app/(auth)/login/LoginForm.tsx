"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { loginSchema } from "@/lib/validators/auth";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField id="email" label="Email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </FormField>
        <FormField id="password" label="Password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={inputCls}
          />
        </FormField>

        <div className="flex items-center justify-between text-xs">
          <Link href="/forgot-password" className="text-gold-deep hover:underline underline-offset-4">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-brand-muted">
            <span className="h-px flex-1 bg-brand-line" /> OR <span className="h-px flex-1 bg-brand-line" />
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: nextPath })}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-line bg-white px-6 py-2.5 text-sm font-medium text-charcoal hover:border-gold"
          >
            Continue with Google
          </button>
        </>
      )}
    </>
  );
}
