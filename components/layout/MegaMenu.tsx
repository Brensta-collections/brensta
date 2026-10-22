"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryWithChildren } from "@/lib/categories";

export function MegaMenu({ categories }: { categories: CategoryWithChildren[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {categories.map((c) => (
        <div
          key={c.id}
          className="relative"
          onMouseEnter={() => setOpenId(c.id)}
          onMouseLeave={() => setOpenId(null)}
        >
          <Link
            href={`/c${c.path}`}
            className="flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-charcoal hover:text-gold-deep lg:px-3 lg:text-sm"
            onFocus={() => setOpenId(c.id)}
            aria-haspopup={c.children.length > 0 ? "menu" : undefined}
            aria-expanded={openId === c.id ? true : undefined}
          >
            {c.name}
            {c.children.length > 0 && <ChevronDown className="h-3 w-3 opacity-60" />}
          </Link>
          {openId === c.id && c.children.length > 0 && (
            <div className="absolute left-1/2 top-full z-50 w-[480px] -translate-x-1/2 pt-2">
              <div className="rounded-xl border border-brand-line bg-ivory p-5 shadow-lg shadow-charcoal/5">
                <div className="mb-3 flex items-baseline justify-between">
                  <h4 className="brand-wordmark text-sm text-gold-deep">{c.name}</h4>
                  <Link href={`/c${c.path}`} className="text-[11px] font-medium uppercase tracking-wider text-brand-muted hover:text-charcoal">
                    View all →
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {c.children.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/c${sub.path}`}
                        className="block rounded px-2 py-1 text-sm text-charcoal hover:bg-champagne/50 hover:text-gold-deep"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
