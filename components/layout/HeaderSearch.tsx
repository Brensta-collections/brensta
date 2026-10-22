"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function HeaderSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL "committed" query — only meaningful on /search.
  const urlQ = pathname === "/search" ? (searchParams.get("q") ?? "") : "";

  // Derived-state-reset pattern (React docs' "Adjusting state when a prop
  // changes" idiom): when the committed URL q changes between renders we
  // reset the local draft so the field reflects the active query. Prefer
  // this over useEffect+setState, which the project's lint rule flags.
  const [q, setQ] = useState<string>(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState<string>(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }

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
        className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep lg:hidden"
        onClick={() => router.push("/search")}
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="hidden items-center lg:flex">
      <label className="flex h-10 w-56 items-center gap-2 rounded-full border border-brand-line bg-white px-4 text-sm text-charcoal transition focus-within:border-gold xl:w-64">
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
