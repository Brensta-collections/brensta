"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import type { CategoryWithChildren } from "@/lib/categories";
import { Logo } from "./Logo";

export function MobileNav({ categories }: { categories: CategoryWithChildren[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = categories.find((c) => c.id === activeId);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal xl:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <div className="flex-1 bg-charcoal/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="h-full w-[86%] max-w-sm overflow-y-auto bg-ivory p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo size="sm" />
              <button
                type="button"
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-md"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!active ? (
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-charcoal hover:bg-champagne/50"
                      onClick={() => (c.children.length ? setActiveId(c.id) : setOpen(false))}
                    >
                      <span>{c.name}</span>
                      {c.children.length > 0 && <ChevronRight className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
                <li className="mt-6 border-t border-brand-line pt-4">
                  <Link href="/search" className="block px-4 py-2 text-sm" onClick={() => setOpen(false)}>Search</Link>
                  <Link href="/wishlist" className="block px-4 py-2 text-sm" onClick={() => setOpen(false)}>Wishlist</Link>
                  <Link href="/cart" className="block px-4 py-2 text-sm" onClick={() => setOpen(false)}>Cart</Link>
                  <Link href="/login" className="block px-4 py-2 text-sm" onClick={() => setOpen(false)}>Login</Link>
                </li>
              </ul>
            ) : (
              <div>
                <button
                  type="button"
                  className="mb-4 inline-flex items-center gap-2 text-sm text-brand-muted"
                  onClick={() => setActiveId(null)}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back
                </button>
                <h3 className="brand-wordmark text-xl text-gold-deep">{active.name}</h3>
                <Link
                  href={`/c${active.path}`}
                  className="mt-2 block text-sm font-medium text-charcoal underline-offset-4 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Shop all {active.name}
                </Link>
                <ul className="mt-4 space-y-1">
                  {active.children.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/c${sub.path}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-4 py-2.5 text-sm text-charcoal hover:bg-champagne/50"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
