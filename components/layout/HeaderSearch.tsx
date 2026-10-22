"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeaderSearch({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  if (compact) {
    return (
      <button
        type="button"
        aria-label="Search"
        className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep"
        onClick={() => router.push("/search")}
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="hidden items-center md:flex">
      <label className="flex h-10 w-72 items-center gap-2 rounded-full border border-brand-line bg-white px-4 text-sm text-charcoal transition focus-within:border-gold">
        <Search className="h-4 w-4 text-brand-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search jewellery, sarees, bags…"
          className="flex-1 bg-transparent outline-none placeholder:text-brand-muted/70"
          aria-label="Search products"
        />
      </label>
    </form>
  );
}
