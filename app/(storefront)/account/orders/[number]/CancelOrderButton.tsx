"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cancelMyOrder } from "@/lib/orders";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setErr(null);
    startTransition(async () => {
      const r = await cancelMyOrder(orderNumber, reason);
      if (!r.ok) return setErr(r.error);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel order
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-brand-line bg-ivory p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Cancel this order?</p>
      <p className="mt-1 text-xs text-brand-muted">Stock will be returned to inventory. This cannot be undone.</p>
      <label className="mt-3 block text-[11px] font-medium text-brand-muted">Reason (optional)</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 400))}
        rows={2}
        placeholder="e.g. Ordered the wrong size"
        className="mt-1 block w-full rounded-md border border-brand-line bg-white px-2 py-1.5 text-sm"
      />
      {err && <p className="mt-2 text-xs text-warm-brown" role="alert">{err}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="primary" size="sm" disabled={pending} onClick={submit}>
          {pending ? "Cancelling…" : "Confirm cancel"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => { setOpen(false); setErr(null); setReason(""); }}>
          Keep order
        </Button>
      </div>
    </div>
  );
}
