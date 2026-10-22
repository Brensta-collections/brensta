"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryWithChildren } from "@/lib/categories";

export function MegaMenu({ categories }: { categories: CategoryWithChildren[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  // One trigger ref per category so Escape restores focus to the opener.
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (!openId) return;
    const activeTrigger = triggerRefs.current[openId];
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenId(null);
        activeTrigger?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      const panel = document.getElementById(`megamenu-panel-${openId}`);
      const target = e.target as Node;
      if (panel?.contains(target)) return;
      if (activeTrigger?.contains(target)) return;
      setOpenId(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [openId]);

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {categories.map((c) => {
        const hasChildren = c.children.length > 0;
        const isOpen = openId === c.id;
        return (
          <div
            key={c.id}
            className="relative"
            onMouseEnter={() => hasChildren && setOpenId(c.id)}
            onMouseLeave={() => setOpenId(null)}
          >
            <Link
              ref={(el) => {
                triggerRefs.current[c.id] = el;
              }}
              href={`/c${c.path}`}
              className="flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-charcoal hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:px-3 lg:text-sm"
              onFocus={() => hasChildren && setOpenId(c.id)}
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-controls={hasChildren ? `megamenu-panel-${c.id}` : undefined}
            >
              {c.name}
              {hasChildren && <ChevronDown aria-hidden="true" className="h-3 w-3 opacity-60" />}
            </Link>
            {isOpen && hasChildren && (
              <div id={`megamenu-panel-${c.id}`} role="menu" aria-label={`${c.name} subcategories`} className="absolute left-1/2 top-full z-50 w-[480px] -translate-x-1/2 pt-2">
                <div className="rounded-xl border border-brand-line bg-ivory p-5 shadow-lg shadow-charcoal/5">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h4 className="brand-wordmark text-sm text-gold-deep">{c.name}</h4>
                    <Link role="menuitem" href={`/c${c.path}`} className="text-[11px] font-medium uppercase tracking-wider text-brand-muted hover:text-charcoal">
                      View all →
                    </Link>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {c.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          role="menuitem"
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
        );
      })}
    </nav>
  );
}
