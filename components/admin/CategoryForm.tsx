"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { createCategory, updateCategory } from "@/lib/admin/categories";
import { slugify } from "@/lib/utils";
import type { PublishStatus } from "@prisma/client";

type Initial = {
  id?: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  image?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: PublishStatus;
  showInMenu?: boolean;
  sortOrder?: number;
};

export function CategoryForm({ initial, parents }: { initial?: Initial; parents: Array<{ id: string; path: string }> }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [v, setV] = useState<Required<Omit<Initial, "id">>>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    parentId: initial?.parentId ?? null,
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    status: initial?.status ?? "DRAFT",
    // Default FALSE for brand-new categories: as the catalogue grows (100+
    // subcategories), the mega menu would overflow if every new row auto-
    // appeared. Admin explicitly promotes a category by ticking this box.
    // Existing rows keep whatever value they were saved with.
    showInMenu: initial?.showInMenu ?? false,
    sortOrder: initial?.sortOrder ?? 0,
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function nameToSlug(name: string) {
    if (!isEdit && v.slug === slugify(v.name)) setV((p) => ({ ...p, slug: slugify(name) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload = {
      name: v.name,
      slug: v.slug,
      parentId: v.parentId || undefined,
      description: v.description || undefined,
      image: v.image || undefined,
      seoTitle: v.seoTitle || undefined,
      seoDescription: v.seoDescription || undefined,
      status: v.status,
      showInMenu: v.showInMenu,
      sortOrder: Number(v.sortOrder),
    };
    startTransition(async () => {
      const r = isEdit ? await updateCategory(initial!.id!, payload) : await createCategory(payload);
      if (!r.ok) return setErr(r.error);
      router.push("/admin/categories");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 max-w-3xl" noValidate>
      <section className="rounded-xl border border-brand-line bg-white p-5">
        <h2 className="brand-wordmark text-lg text-charcoal">Basics</h2>
        <div className="mt-4 grid gap-4">
          <FormField id="name" label="Name">
            <input id="name" className={inputCls} required value={v.name} onChange={(e) => { setV({ ...v, name: e.target.value }); nameToSlug(e.target.value); }} />
          </FormField>
          <FormField id="slug" label="Slug">
            <input id="slug" className={inputCls} required value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} />
          </FormField>
          <FormField id="parent" label="Parent category" hint="Leave blank for a top-level category.">
            <select id="parent" className={inputCls} value={v.parentId ?? ""} onChange={(e) => setV({ ...v, parentId: e.target.value || null })}>
              <option value="">— None (top-level) —</option>
              {parents.filter((p) => p.id !== initial?.id).map((p) => (
                <option key={p.id} value={p.id}>{p.path}</option>
              ))}
            </select>
          </FormField>
          <FormField id="desc" label="Description">
            <textarea id="desc" rows={3} className={inputCls} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} />
          </FormField>
          <FormField id="image" label="Category image URL" hint="Optional. Can be an uploaded /uploads/… path.">
            <input id="image" className={inputCls} value={v.image ?? ""} onChange={(e) => setV({ ...v, image: e.target.value })} />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-5">
        <h2 className="brand-wordmark text-lg text-charcoal">Visibility</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <FormField id="status" label="Status">
            <select id="status" className={inputCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as PublishStatus })}>
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>HIDDEN</option>
              <option>ARCHIVED</option>
            </select>
          </FormField>
          <FormField id="sort" label="Sort order">
            <input id="sort" type="number" min={0} className={inputCls} value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })} />
          </FormField>
          <label className="flex items-center gap-2 pt-7 text-sm">
            <input type="checkbox" checked={v.showInMenu} onChange={(e) => setV({ ...v, showInMenu: e.target.checked })} /> Show in navigation menu
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-5">
        <h2 className="brand-wordmark text-lg text-charcoal">SEO</h2>
        <div className="mt-4 grid gap-4">
          <FormField id="seoTitle" label="SEO title">
            <input id="seoTitle" className={inputCls} maxLength={70} value={v.seoTitle ?? ""} onChange={(e) => setV({ ...v, seoTitle: e.target.value })} />
          </FormField>
          <FormField id="seoDesc" label="SEO description">
            <textarea id="seoDesc" rows={2} className={inputCls} maxLength={180} value={v.seoDescription ?? ""} onChange={(e) => setV({ ...v, seoDescription: e.target.value })} />
          </FormField>
        </div>
      </section>

      {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">{err}</div>}

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : isEdit ? "Save changes" : "Create category"}</Button>
      </div>
    </form>
  );
}
