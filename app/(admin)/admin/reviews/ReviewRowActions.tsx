"use client";

import { useTransition } from "react";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { moderateReview } from "@/lib/admin/reviews";
import type { ReviewStatus } from "@prisma/client";

export function ReviewRowActions({ id, status }: { id: string; status: ReviewStatus }) {
  const [pending, startTransition] = useTransition();
  function go(next: ReviewStatus, requireReason = false) {
    const reason = requireReason ? prompt("Reason (shown in audit log)") ?? undefined : undefined;
    if (requireReason && !reason) return;
    startTransition(() => moderateReview(id, next, reason));
  }
  return (
    <div className="flex shrink-0 items-start gap-1 text-brand-muted">
      {status !== "PUBLISHED" && (
        <button type="button" disabled={pending} onClick={() => go("PUBLISHED")} className="rounded p-1.5 hover:bg-gold/10 hover:text-gold-deep" aria-label="Approve"><Check className="h-4 w-4" /></button>
      )}
      {status !== "HIDDEN" && (
        <button type="button" disabled={pending} onClick={() => go("HIDDEN", true)} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Hide"><EyeOff className="h-4 w-4" /></button>
      )}
      {status !== "REMOVED" && (
        <button type="button" disabled={pending} onClick={() => go("REMOVED", true)} className="rounded p-1.5 hover:bg-warm-brown/10 hover:text-warm-brown" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
      )}
    </div>
  );
}
