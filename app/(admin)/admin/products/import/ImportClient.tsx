"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { previewProductCsv, applyProductCsv, exportProductsCsv } from "@/lib/admin/product-csv";
import type { ImportPreviewRow } from "@/lib/admin/product-csv";

export function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(f: File) {
    const text = await f.text();
    setCsvText(text);
    setPreview(null);
    setMsg(null);
    setErr(null);
  }

  function doPreview() {
    setErr(null); setMsg(null);
    startTransition(async () => {
      const r = await previewProductCsv(csvText);
      if (!r.ok) { setErr(r.error); setPreview(null); return; }
      setPreview(r.rows);
    });
  }

  function doImport() {
    if (!preview) return;
    const errors = preview.filter((r) => r.action === "error").length;
    if (errors > 0 && !confirm(`${errors} line(s) have errors and will be skipped. Continue?`)) return;
    startTransition(async () => {
      const r = await applyProductCsv(csvText);
      if (!r.ok) return setErr(r.error);
      setMsg(`Imported — created ${r.created}, updated ${r.updated}, skipped ${r.skipped}.`);
      setPreview(null);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  async function doExport() {
    const csv = await exportProductsCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brensta-products-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <section className="rounded-xl border border-brand-line bg-white p-5">
          <h2 className="brand-wordmark text-lg text-charcoal">Import</h2>
          <p className="mt-1 text-xs text-brand-muted">
            Headers required: <code>name, slug, sku, category_path, base_price, stock</code>. Use <code>category_path</code> like <code>/jewellery/earrings</code>.
          </p>
          <div className="mt-4 flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-xs" />
            <Button type="button" variant="outline" size="sm" onClick={doPreview} disabled={!csvText || pending}>Preview</Button>
            <Button type="button" variant="primary" size="sm" onClick={doImport} disabled={!preview || pending}>Import</Button>
          </div>
          {err && <div className="mt-3 rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-2 text-xs text-warm-brown">{err}</div>}
          {msg && <div className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-deep">{msg}</div>}
          {preview && (
            <div className="mt-4 overflow-hidden rounded-lg border border-brand-line">
              <table className="min-w-full divide-y divide-brand-line text-xs">
                <thead className="bg-ivory text-left text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                  <tr>
                    <th className="px-3 py-2">Line</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {preview.map((r) => (
                    <tr key={r.line} className={r.action === "error" ? "bg-warm-brown/5" : ""}>
                      <td className="px-3 py-1.5">{r.line}</td>
                      <td className={`px-3 py-1.5 font-semibold ${r.action === "create" ? "text-gold-deep" : r.action === "update" ? "text-charcoal" : "text-warm-brown"}`}>{r.action.toUpperCase()}</td>
                      <td className="px-3 py-1.5">{r.name ?? "—"}</td>
                      <td className="px-3 py-1.5 font-mono">{r.sku ?? "—"}</td>
                      <td className="px-3 py-1.5">{r.categoryPath ?? "—"}</td>
                      <td className="px-3 py-1.5">{r.basePrice ?? "—"}</td>
                      <td className="px-3 py-1.5">{r.stock ?? "—"}</td>
                      <td className="px-3 py-1.5 text-brand-muted">{r.message ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-brand-line bg-white p-5">
        <h2 className="brand-wordmark text-lg text-charcoal">Export</h2>
        <p className="mt-1 text-xs text-brand-muted">Download all products with their SKUs and stock.</p>
        <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={doExport}>Download CSV</Button>
      </aside>
    </div>
  );
}
