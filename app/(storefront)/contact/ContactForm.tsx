"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { feedbackSchema } from "@/lib/validators/feedback";

export function ContactForm() {
  const [v, setV] = useState({ name: "", email: "", subject: "", body: "" });
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const parsed = feedbackSchema.safeParse(v);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Please check the form.");

    startTransition(async () => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) return setErr(json.error ?? "Could not send message.");
      setSent(true);
      setV({ name: "", email: "", subject: "", body: "" });
    });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal">
        Thank you — we&apos;ve received your message and will reply from the admin inbox soon.
        <p className="mt-2 text-[11px] text-brand-muted">Email notifications are not yet enabled on this build; the admin will see your message in the dashboard.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField id="name" label="Your name">
        <input id="name" className={inputCls} required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </FormField>
      <FormField id="email" label="Email">
        <input id="email" type="email" className={inputCls} required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
      </FormField>
      <FormField id="subject" label="Subject">
        <input id="subject" className={inputCls} required value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} />
      </FormField>
      <FormField id="body" label="Message">
        <textarea id="body" rows={5} className={inputCls} required value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
      </FormField>
      {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">{err}</div>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
