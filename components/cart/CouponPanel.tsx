"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { applyCouponToCart, removeCouponFromCart } from "@/lib/coupons";
import { formatINR } from "@/lib/utils";

type Props = {
  initialCode: string | null;
  initialDiscount: number;
};

export function CouponPanel({ initialCode, initialDiscount }: Props) {
  const [code, setCode] = useState(initialCode ?? "");
  const [appliedCode, setAppliedCode] = useState(initialCode ?? "");
  const [discount, setDiscount] = useState(initialDiscount);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onApply(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return setErr("Enter a coupon code.");
    startTransition(async () => {
      const r = await applyCouponToCart(trimmed);
      if (!r.ok) return setErr(r.error);
      setAppliedCode(r.code);
      setDiscount(r.discount);
      setMsg(`Coupon applied — saving ${formatINR(r.discount)}.`);
    });
  }

  function onRemove() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      await removeCouponFromCart();
      setAppliedCode("");
      setCode("");
      setDiscount(0);
      setMsg("Coupon removed.");
    });
  }

  return (
    <div className="rounded-lg border border-brand-line bg-ivory p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-deep">Coupon</p>
      {appliedCode ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
          <div>
            <span className="font-mono font-semibold text-charcoal">{appliedCode}</span>
            <span className="ml-2 text-xs text-brand-muted">− {formatINR(discount)}</span>
          </div>
          <button type="button" onClick={onRemove} disabled={pending} aria-label="Remove coupon" className="rounded p-1 text-brand-muted hover:text-warm-brown">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={onApply} className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            // min-w-0 lets flex-1 actually shrink the input: without it, the
            // browser's default input intrinsic width (size≈20 characters)
            // keeps the form row wider than its narrow-mobile cell.
            className="min-w-0 flex-1 rounded-full border border-brand-line bg-white px-3 py-1.5 text-sm uppercase placeholder:text-brand-muted/60 focus:border-gold focus:outline-none"
            autoCapitalize="characters"
            aria-label="Coupon code"
            maxLength={40}
          />
          <Button type="submit" variant="outline" size="sm" disabled={pending || !code.trim()}>
            {pending ? "Applying…" : "Apply"}
          </Button>
        </form>
      )}
      {err && <p className="mt-2 text-xs text-warm-brown" role="alert">{err}</p>}
      {msg && !err && <p className="mt-2 text-xs text-gold-deep" role="status">{msg}</p>}
    </div>
  );
}
