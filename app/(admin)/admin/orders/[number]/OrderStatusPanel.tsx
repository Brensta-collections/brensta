"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ALLOWED_TRANSITIONS } from "@/lib/order-status";
import { updateOrderStatus } from "@/lib/admin/orders";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusPanel({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [tracking, setTracking] = useState({ courier: "", number: "", url: "" });
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const allowed = ALLOWED_TRANSITIONS[status] ?? [];

  function go(next: OrderStatus) {
    setErr(null); setMsg(null);
    if (next === "CANCELLED" && !confirm("Cancel this order? Stock will be restored.")) return;
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, next, reason || undefined, next === "SHIPPED" ? tracking : undefined);
      if (!r.ok) return setErr(r.error);
      setMsg(`Order moved to ${next}.`);
    });
  }

  return (
    <section className="rounded-xl border border-brand-line bg-white p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Current status</h3>
      <p className="mt-1 font-mono text-sm text-charcoal">{status}</p>

      {allowed.length === 0 ? (
        <p className="mt-4 text-xs text-brand-muted">No further transitions from this state.</p>
      ) : (
        <>
          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Reason / note (optional)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 block w-full rounded-md border border-brand-line bg-ivory px-2 py-1.5 text-sm" />
          </div>

          {allowed.includes("SHIPPED") && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Shipping (if moving to SHIPPED)</p>
              <input placeholder="Courier" value={tracking.courier} onChange={(e) => setTracking({ ...tracking, courier: e.target.value })} className="block w-full rounded-md border border-brand-line bg-ivory px-2 py-1.5 text-sm" />
              <input placeholder="Tracking number" value={tracking.number} onChange={(e) => setTracking({ ...tracking, number: e.target.value })} className="block w-full rounded-md border border-brand-line bg-ivory px-2 py-1.5 text-sm" />
              <input placeholder="Tracking URL (optional)" value={tracking.url} onChange={(e) => setTracking({ ...tracking, url: e.target.value })} className="block w-full rounded-md border border-brand-line bg-ivory px-2 py-1.5 text-sm" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {allowed.map((s) => (
              <Button key={s} type="button" variant={s === "CANCELLED" ? "outline" : "primary"} size="sm" disabled={pending} onClick={() => go(s)}>
                → {s}
              </Button>
            ))}
          </div>
          {err && <div className="mt-3 rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">{err}</div>}
          {msg && <div className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-deep">{msg}</div>}
          <p className="mt-3 text-[10px] text-brand-muted">
            Online refunds happen via the payment provider (Razorpay — M6). COD cancellations restore stock and mark the payment FAILED.
          </p>
        </>
      )}
    </section>
  );
}
