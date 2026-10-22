"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { updateFeedback } from "@/lib/admin/feedback";
import type { FeedbackStatus } from "@prisma/client";

type F = { id: string; name: string; email: string; subject: string; body: string; status: FeedbackStatus; reply: string | null; createdAt: string };

export function FeedbackRow({ f }: { f: F }) {
  const [reply, setReply] = useState(f.reply ?? "");
  const [pending, startTransition] = useTransition();

  function act(status: FeedbackStatus) {
    startTransition(() => updateFeedback(f.id, status, status === "REPLIED" ? reply : undefined));
  }

  return (
    <li className="rounded-xl border border-brand-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-charcoal">{f.subject}</h3>
          <p className="mt-1 text-[11px] text-brand-muted">From {f.name} ({f.email}) · {new Date(f.createdAt).toLocaleString("en-IN")}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-charcoal/80">{f.body}</p>
          {f.status === "REPLIED" && f.reply && (
            <div className="mt-3 rounded-lg border border-brand-line bg-ivory p-3 text-sm">
              <p className="text-[11px] uppercase tracking-wider text-gold-deep">Our reply</p>
              <p className="mt-1 whitespace-pre-wrap text-charcoal">{f.reply}</p>
            </div>
          )}
        </div>
        <span className="rounded bg-champagne/60 px-2 py-0.5 text-[10px] font-semibold uppercase">{f.status}</span>
      </div>
      {f.status !== "CLOSED" && (
        <div className="mt-4 space-y-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Internal reply (not emailed until M7)" className="block w-full rounded-md border border-brand-line bg-ivory px-2 py-1.5 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="primary" size="sm" disabled={pending || !reply.trim()} onClick={() => act("REPLIED")}>Mark replied</Button>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => act("CLOSED")}>Close</Button>
          </div>
          <p className="text-[10px] text-brand-muted">Email delivery arrives in M7. Marking replied records your note in the audit log.</p>
        </div>
      )}
    </li>
  );
}
