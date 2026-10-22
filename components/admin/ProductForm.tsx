"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, inputCls } from "@/components/auth/FormField";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { createProduct, updateProduct, removeProductImage, reorderProductImages } from "@/lib/admin/products";
import type { PublishStatus } from "@prisma/client";
import { slugify } from "@/lib/utils";

type CategoryOpt = { id: string; name: string; path: string };
type AttributeDef = { id: string; code: string; name: string; type: string; options: unknown };
type ImageRow = { id: string; url: string; alt?: string | null; sortOrder: number };

type Variant = {
  id?: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  optionValues: Record<string, string>;
  isActive: boolean;
};

type Initial = {
  id?: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  brand: string;
  basePrice: number;
  baseSalePrice?: number | null;
  taxRatePct?: number | null;
  status: PublishStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryIds: string[];
  primaryCategoryId: string;
  attributeValues: Array<{ code: string; value: string }>;
  variants: Variant[];
  images: ImageRow[];
};

export function ProductForm({ initial, categories, attributeDefs }: { initial?: Partial<Initial>; categories: CategoryOpt[]; attributeDefs: AttributeDef[] }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [v, setV] = useState<Initial>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    brand: initial?.brand ?? "BRENSTA",
    basePrice: initial?.basePrice ?? 0,
    baseSalePrice: initial?.baseSalePrice ?? null,
    taxRatePct: initial?.taxRatePct ?? null,
    status: (initial?.status as PublishStatus) ?? "DRAFT",
    isFeatured: initial?.isFeatured ?? false,
    isNewArrival: initial?.isNewArrival ?? false,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    categoryIds: initial?.categoryIds ?? [],
    primaryCategoryId: initial?.primaryCategoryId ?? "",
    attributeValues: initial?.attributeValues ?? [],
    variants: initial?.variants?.length ? initial.variants : [{ sku: "", price: 0, salePrice: null, stock: 0, lowStockThreshold: 5, optionValues: { Size: "" }, isActive: true }],
    images: initial?.images ?? [],
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function patch<K extends keyof Initial>(k: K, val: Initial[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function nameToSlug(name: string) {
    if (!isEdit && v.slug === slugify(v.name)) patch("slug", slugify(name));
  }

  function toggleCategory(id: string) {
    const has = v.categoryIds.includes(id);
    const next = has ? v.categoryIds.filter((x) => x !== id) : [...v.categoryIds, id];
    const nextPrimary = next.includes(v.primaryCategoryId) ? v.primaryCategoryId : next[0] ?? "";
    setV({ ...v, categoryIds: next, primaryCategoryId: nextPrimary });
  }

  function setAttr(code: string, value: string) {
    const others = v.attributeValues.filter((a) => a.code !== code);
    patch("attributeValues", value ? [...others, { code, value }] : others);
  }

  function updateVariant(idx: number, patch: Partial<Variant>) {
    const next = v.variants.map((x, i) => (i === idx ? { ...x, ...patch } : x));
    setV({ ...v, variants: next });
  }

  function updateVariantOption(idx: number, key: string, value: string) {
    const current = v.variants[idx];
    const nextOpts = { ...current.optionValues, [key]: value };
    updateVariant(idx, { optionValues: nextOpts });
  }

  function addVariant() {
    const sample = v.variants[0] ?? { sku: "", price: v.basePrice, salePrice: null, stock: 0, lowStockThreshold: 5, optionValues: {}, isActive: true };
    const nextOpts: Record<string, string> = {};
    for (const k of Object.keys(sample.optionValues)) nextOpts[k] = "";
    patch("variants", [...v.variants, { sku: "", price: v.basePrice, salePrice: v.baseSalePrice ?? null, stock: 0, lowStockThreshold: 5, optionValues: nextOpts, isActive: true }]);
  }

  function removeVariant(idx: number) {
    if (v.variants.length <= 1) return;
    const next = v.variants.filter((_, i) => i !== idx);
    setV({ ...v, variants: next });
  }

  function addOptionKey() {
    const key = prompt("Option name (e.g. Size, Color, Metal)")?.trim();
    if (!key) return;
    const nextVariants = v.variants.map((vv) => ({ ...vv, optionValues: { ...vv.optionValues, [key]: "" } }));
    setV({ ...v, variants: nextVariants });
  }

  function removeOptionKey(key: string) {
    const nextVariants = v.variants.map((vv) => {
      const nextOpts = { ...vv.optionValues };
      delete nextOpts[key];
      return { ...vv, optionValues: nextOpts };
    });
    setV({ ...v, variants: nextVariants });
  }

  async function uploadImage(file: File) {
    if (!isEdit || !initial?.id) return;
    const form = new FormData();
    form.append("productId", initial.id);
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const json = (await res.json()) as { ok?: boolean; image?: { id: string; url: string }; error?: string };
    if (!res.ok || !json.ok || !json.image) {
      setErr(json.error ?? "Upload failed.");
      return;
    }
    patch("images", [...v.images, { id: json.image.id, url: json.image.url, sortOrder: v.images.length }]);
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) await uploadImage(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removeImage(id: string) {
    if (!confirm("Remove this image?")) return;
    await removeProductImage(id);
    patch("images", v.images.filter((img) => img.id !== id));
  }

  async function moveImage(id: string, dir: -1 | 1) {
    const list = [...v.images];
    const idx = list.findIndex((x) => x.id === id);
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    [list[idx], list[to]] = [list[to], list[idx]];
    patch("images", list.map((x, i) => ({ ...x, sortOrder: i })));
    await reorderProductImages(initial!.id!, list.map((x) => x.id));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const payload = {
      ...v,
      shortDescription: v.shortDescription || undefined,
      description: v.description || undefined,
      seoTitle: v.seoTitle || undefined,
      seoDescription: v.seoDescription || undefined,
      baseSalePrice: v.baseSalePrice ?? undefined,
      taxRatePct: v.taxRatePct ?? undefined,
      variants: v.variants.map((vv) => ({
        ...vv,
        salePrice: vv.salePrice ?? undefined,
      })),
    };
    startTransition(async () => {
      const r = isEdit ? await updateProduct(initial!.id!, payload) : await createProduct(payload);
      if (!r.ok) return setErr(r.error);
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-5">
        {/* Basics */}
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h2 className="brand-wordmark text-lg text-charcoal">Basics</h2>
          <div className="mt-4 grid gap-4">
            <FormField id="name" label="Name">
              <input id="name" className={inputCls} required value={v.name} onChange={(e) => { patch("name", e.target.value); nameToSlug(e.target.value); }} />
            </FormField>
            <FormField id="slug" label="Slug" hint="Used in /p/<slug>. Lowercase letters, numbers, dashes.">
              <input id="slug" className={inputCls} required value={v.slug} onChange={(e) => patch("slug", e.target.value)} />
            </FormField>
            <FormField id="short" label="Short description">
              <input id="short" className={inputCls} maxLength={300} value={v.shortDescription ?? ""} onChange={(e) => patch("shortDescription", e.target.value)} />
            </FormField>
            <FormField id="desc" label="Description">
              <textarea id="desc" rows={6} className={inputCls} value={v.description ?? ""} onChange={(e) => patch("description", e.target.value)} />
            </FormField>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="brand-wordmark text-lg text-charcoal">Images</h2>
            {isEdit ? (
              <>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => onPickFiles(e.target.files)} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Upload</Button>
              </>
            ) : (
              <span className="text-[11px] text-brand-muted">Save the product first to upload images.</span>
            )}
          </div>
          {v.images.length === 0 ? (
            <p className="mt-3 text-sm text-brand-muted">No images yet. First image becomes the primary.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {v.images.map((img, i) => {
                const placeholder = img.url.startsWith("placeholder:");
                return (
                  <li key={img.id} className="relative rounded-lg border border-brand-line bg-champagne/30">
                    <div className="aspect-square overflow-hidden rounded-lg">
                      {placeholder ? (
                        <PlaceholderImage seed={img.url} label={v.name} aspect="square" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt={img.alt ?? v.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    {i === 0 && <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[9px] font-semibold uppercase text-charcoal">Primary</span>}
                    <div className="flex items-center justify-between gap-1 p-1 text-xs">
                      <button type="button" aria-label="Up" onClick={() => moveImage(img.id, -1)} className="rounded p-1 text-brand-muted hover:bg-ivory">←</button>
                      <GripVertical className="h-3 w-3 text-brand-muted" />
                      <button type="button" aria-label="Down" onClick={() => moveImage(img.id, 1)} className="rounded p-1 text-brand-muted hover:bg-ivory">→</button>
                      <button type="button" aria-label="Delete" onClick={() => removeImage(img.id)} className="rounded p-1 text-warm-brown hover:bg-warm-brown/10"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Variants */}
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="brand-wordmark text-lg text-charcoal">Variants ({v.variants.length})</h2>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={addOptionKey}>+ Option (Size, Color…)</Button>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus className="h-4 w-4" /> Variant</Button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {v.variants[0] && Object.keys(v.variants[0].optionValues).length > 0 && (
              <div className="flex flex-wrap gap-1 text-[11px]">
                {Object.keys(v.variants[0].optionValues).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full bg-champagne/60 px-2 py-0.5">
                    {k}
                    <button type="button" onClick={() => removeOptionKey(k)} className="text-brand-muted hover:text-warm-brown">×</button>
                  </span>
                ))}
              </div>
            )}
            {v.variants.map((vv, idx) => (
              <div key={idx} className="grid gap-2 rounded-lg border border-brand-line bg-ivory p-3 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">SKU</label>
                  <input className={inputCls} value={vv.sku} onChange={(e) => updateVariant(idx, { sku: e.target.value.toUpperCase() })} />
                  {Object.keys(vv.optionValues).map((k) => (
                    <div key={k} className="mt-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{k}</label>
                      <input className={inputCls} value={vv.optionValues[k]} onChange={(e) => updateVariantOption(idx, k, e.target.value)} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Price ₹</label>
                    <input type="number" min={0} className={inputCls} value={vv.price} onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Sale ₹</label>
                    <input type="number" min={0} className={inputCls} value={vv.salePrice ?? ""} onChange={(e) => updateVariant(idx, { salePrice: e.target.value === "" ? null : Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Stock</label>
                    <input type="number" min={0} className={inputCls} value={vv.stock} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Low ≤</label>
                    <input type="number" min={0} className={inputCls} value={vv.lowStockThreshold} onChange={(e) => updateVariant(idx, { lowStockThreshold: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-1 text-xs text-charcoal">
                    <input type="checkbox" checked={vv.isActive} onChange={(e) => updateVariant(idx, { isActive: e.target.checked })} />
                    Active
                  </label>
                  <button type="button" onClick={() => removeVariant(idx)} className="rounded p-1.5 text-brand-muted hover:bg-warm-brown/10 hover:text-warm-brown" aria-label="Remove variant">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Attributes */}
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h2 className="brand-wordmark text-lg text-charcoal">Attributes</h2>
          <p className="mt-1 text-xs text-brand-muted">Shown on the product page and used for category filters.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {attributeDefs.map((d) => {
              const current = v.attributeValues.find((a) => a.code === d.code)?.value ?? "";
              const opts = Array.isArray(d.options) ? (d.options as string[]) : null;
              return (
                <div key={d.id}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{d.name}</label>
                  {opts ? (
                    <select className={inputCls} value={current} onChange={(e) => setAttr(d.code, e.target.value)}>
                      <option value="">—</option>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className={inputCls} value={current} onChange={(e) => setAttr(d.code, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SEO */}
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h2 className="brand-wordmark text-lg text-charcoal">SEO</h2>
          <div className="mt-4 grid gap-4">
            <FormField id="seoTitle" label="SEO title" hint="Max 70 characters.">
              <input id="seoTitle" className={inputCls} maxLength={70} value={v.seoTitle ?? ""} onChange={(e) => patch("seoTitle", e.target.value)} />
            </FormField>
            <FormField id="seoDesc" label="SEO description" hint="Max 180 characters.">
              <textarea id="seoDesc" rows={2} className={inputCls} maxLength={180} value={v.seoDescription ?? ""} onChange={(e) => patch("seoDescription", e.target.value)} />
            </FormField>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Status</h3>
          <select className={`${inputCls} mt-2`} value={v.status} onChange={(e) => patch("status", e.target.value as PublishStatus)}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="HIDDEN">Hidden</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={v.isFeatured} onChange={(e) => patch("isFeatured", e.target.checked)} /> Featured (bestseller)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={v.isNewArrival} onChange={(e) => patch("isNewArrival", e.target.checked)} /> New arrival</label>
          </div>
        </section>

        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Pricing</h3>
          <div className="mt-3 grid gap-3">
            <FormField id="basePrice" label="Base price ₹">
              <input id="basePrice" type="number" min={0} className={inputCls} value={v.basePrice} onChange={(e) => patch("basePrice", Number(e.target.value))} />
            </FormField>
            <FormField id="baseSale" label="Base sale ₹ (optional)">
              <input id="baseSale" type="number" min={0} className={inputCls} value={v.baseSalePrice ?? ""} onChange={(e) => patch("baseSalePrice", e.target.value === "" ? null : Number(e.target.value))} />
            </FormField>
            <FormField id="tax" label="Tax rate %">
              <input id="tax" type="number" min={0} max={28} className={inputCls} value={v.taxRatePct ?? ""} onChange={(e) => patch("taxRatePct", e.target.value === "" ? null : Number(e.target.value))} />
            </FormField>
            <FormField id="brand" label="Brand">
              <input id="brand" className={inputCls} value={v.brand} onChange={(e) => patch("brand", e.target.value)} />
            </FormField>
          </div>
        </section>

        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Categories</h3>
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
            {categories.map((c) => {
              const checked = v.categoryIds.includes(c.id);
              return (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={() => toggleCategory(c.id)} />
                    <span className="text-charcoal">{c.path}</span>
                  </label>
                  {checked && (
                    <button type="button" onClick={() => patch("primaryCategoryId", c.id)} className={`text-[10px] uppercase tracking-wider ${v.primaryCategoryId === c.id ? "text-gold-deep" : "text-brand-muted hover:text-charcoal"}`}>
                      {v.primaryCategoryId === c.id ? "Primary" : "Make primary"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {err && <div className="rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown" role="alert">{err}</div>}

        <div className="sticky bottom-4 flex gap-2 rounded-xl border border-brand-line bg-white p-3 shadow-sm">
          <Button type="submit" variant="primary" className="flex-1" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </aside>
    </form>
  );
}
