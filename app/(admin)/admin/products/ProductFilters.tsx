"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function ProductFilters({
  q,
  status,
  stock,
  categoryId,
  categories,
}: {
  q: string;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED" | "ALL";
  stock: "low" | "out" | "all";
  categoryId?: string;
  categories: Array<{ id: string; name: string; path: string }>;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();

  function set(k: string, v?: string) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete("page");
    router.push(`${path}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-line bg-white p-3">
      <form
        className="flex-1 min-w-[220px]"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget as HTMLFormElement);
          set("q", String(data.get("q") ?? "") || undefined);
        }}
      >
        <label className="flex h-9 w-full items-center gap-2 rounded-md border border-brand-line bg-ivory px-2 text-sm">
          <Search className="h-4 w-4 text-brand-muted" />
          <input name="q" defaultValue={q} placeholder="Search by name, slug, SKU…" className="flex-1 bg-transparent outline-none" />
        </label>
      </form>
      <select
        value={status}
        onChange={(e) => set("status", e.target.value === "ALL" ? undefined : e.target.value)}
        className="h-9 rounded-md border border-brand-line bg-ivory px-2 text-sm"
      >
        <option value="ALL">All status</option>
        <option>DRAFT</option>
        <option>PUBLISHED</option>
        <option>HIDDEN</option>
        <option>ARCHIVED</option>
      </select>
      <select
        value={stock}
        onChange={(e) => set("stock", e.target.value === "all" ? undefined : e.target.value)}
        className="h-9 rounded-md border border-brand-line bg-ivory px-2 text-sm"
      >
        <option value="all">All stock</option>
        <option value="low">Low stock (≤5)</option>
        <option value="out">Out of stock</option>
      </select>
      <select
        value={categoryId ?? ""}
        onChange={(e) => set("categoryId", e.target.value || undefined)}
        className="h-9 max-w-[220px] rounded-md border border-brand-line bg-ivory px-2 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.path}</option>
        ))}
      </select>
    </div>
  );
}
