"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type Status = "ALL" | "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED";

export function OrderFilters({ q, status, from, to }: { q: string; status: Status; from: string; to: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();

  function set(k: string, v?: string) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
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
          <input name="q" defaultValue={q} placeholder="Search by order #, email, phone…" className="flex-1 bg-transparent outline-none" />
        </label>
      </form>
      <select value={status} onChange={(e) => set("status", e.target.value === "ALL" ? undefined : e.target.value)} className="h-9 rounded-md border border-brand-line bg-ivory px-2 text-sm">
        <option value="ALL">All status</option>
        <option>PENDING</option><option>CONFIRMED</option><option>PROCESSING</option><option>SHIPPED</option><option>DELIVERED</option><option>CANCELLED</option><option>RETURNED</option><option>REFUNDED</option>
      </select>
      <input type="date" value={from} onChange={(e) => set("from", e.target.value || undefined)} className="h-9 rounded-md border border-brand-line bg-ivory px-2 text-sm" />
      <input type="date" value={to} onChange={(e) => set("to", e.target.value || undefined)} className="h-9 rounded-md border border-brand-line bg-ivory px-2 text-sm" />
    </div>
  );
}
