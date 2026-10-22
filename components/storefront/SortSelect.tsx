"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function SortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params);
    next.set("sort", e.target.value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-brand-muted">
      <span className="hidden md:inline">Sort by</span>
      <select
        value={current ?? "popularity"}
        onChange={onChange}
        className="rounded-full border border-brand-line bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
