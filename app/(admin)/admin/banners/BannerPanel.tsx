"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { deleteBanner, saveBanner } from "@/lib/admin/banners";

type B = {
  id?: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY: B = { section: "hero", title: "", subtitle: "", imageUrl: "", ctaText: "", ctaUrl: "", sortOrder: 0, isActive: true };

export function BannerPanel({ banners }: { banners: B[] }) {
  const [editing, setEditing] = useState<B | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!editing) return;
    setErr(null);
    startTransition(async () => {
      const r = await saveBanner(editing.id ?? null, {
        section: editing.section,
        title: editing.title || undefined,
        subtitle: editing.subtitle || undefined,
        imageUrl: editing.imageUrl,
        ctaText: editing.ctaText || undefined,
        ctaUrl: editing.ctaUrl || undefined,
        sortOrder: editing.sortOrder,
        isActive: editing.isActive,
        categoryId: null,
      });
      if (!r.ok) return setErr(r.error);
      setEditing(null);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {banners.length === 0 && <p className="rounded-xl border border-brand-line bg-white p-5 text-sm text-brand-muted">No banners yet. Create one on the right.</p>}
        {banners.map((b) => (
          <div key={b.id} className="flex items-start justify-between gap-4 rounded-xl border border-brand-line bg-white p-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-gold-deep">{b.section}</p>
              <h3 className="font-semibold text-charcoal">{b.title ?? "—"}</h3>
              <p className="truncate text-xs text-brand-muted">{b.subtitle ?? ""}</p>
              <p className="mt-1 font-mono text-[11px] text-brand-muted">img: {b.imageUrl.slice(0, 80)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${b.isActive ? "bg-gold/20 text-gold-deep" : "bg-brand-muted/30 text-charcoal"}`}>
                {b.isActive ? "Live" : "Off"}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(b)}>Edit</Button>
              <button
                type="button"
                onClick={() => { if (confirm(`Delete banner "${b.title ?? b.section}"?`)) startTransition(() => deleteBanner(b.id!)); }}
                className="rounded p-1.5 text-brand-muted hover:bg-warm-brown/10 hover:text-warm-brown"
                aria-label="Delete"
              ><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <aside className="rounded-xl border border-brand-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="brand-wordmark text-lg text-charcoal">{editing?.id ? "Edit banner" : "New banner"}</h3>
          {editing && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Clear</Button>
          )}
        </div>
        {!editing && (
          <Button type="button" variant="primary" size="sm" className="mt-3" onClick={() => setEditing(EMPTY)}><Plus className="h-4 w-4" /> Add banner</Button>
        )}
        {editing && (
          <div className="mt-4 space-y-3">
            <FormField id="section" label="Section" hint="e.g. hero, mid, footer">
              <input id="section" className={inputCls} value={editing.section} onChange={(e) => setEditing({ ...editing, section: e.target.value })} />
            </FormField>
            <FormField id="title" label="Title">
              <input id="title" className={inputCls} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </FormField>
            <FormField id="subtitle" label="Subtitle">
              <input id="subtitle" className={inputCls} value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            </FormField>
            <FormField id="imageUrl" label="Image URL" hint="/uploads/… or external">
              <input id="imageUrl" className={inputCls} value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="ctaText" label="CTA text">
                <input id="ctaText" className={inputCls} value={editing.ctaText ?? ""} onChange={(e) => setEditing({ ...editing, ctaText: e.target.value })} />
              </FormField>
              <FormField id="ctaUrl" label="CTA URL">
                <input id="ctaUrl" className={inputCls} value={editing.ctaUrl ?? ""} onChange={(e) => setEditing({ ...editing, ctaUrl: e.target.value })} />
              </FormField>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs">Order: <input type="number" className={`${inputCls} ml-2 w-20`} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            </div>
            {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">{err}</div>}
            <div className="flex gap-2">
              <Button type="button" variant="primary" size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save banner"}</Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
