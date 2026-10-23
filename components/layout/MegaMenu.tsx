"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryWithChildren } from "@/lib/categories";
import { clampPanelLeft } from "@/lib/mega-menu-position";

const VIEWPORT_GUTTER_PX = 16;

export function MegaMenu({ categories }: { categories: CategoryWithChildren[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Per-category refs so Escape can restore focus to the exact trigger that opened.
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Panel's parent-relative `left` in CSS px once we've measured. Null means
  // "fall back to the Tailwind left-1/2 -translate-x-1/2 default".
  const [panelLeftPx, setPanelLeftPx] = useState<number | null>(null);

  // Clamp the open panel so it stays fully in the viewport. Runs before
  // paint via useLayoutEffect — no visible flicker. Rebinds on resize while
  // open and clears on close so a stale px value doesn't leak between panels.
  //
  // Lint note: setState inside this effect is the React-sanctioned pattern
  // for syncing with an external system (DOM measurements + resize events).
  // The panel's offsetWidth isn't known until the panel has mounted, so we
  // cannot derive the clamped left during render. The two setPanelLeftPx
  // calls below have targeted eslint-disable-next-line comments.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (!openId) {
      setPanelLeftPx(null);
      return;
    }
    function reposition() {
      const trigger = triggerRefs.current[openId!];
      const panel = panelRefs.current[openId!];
      if (!trigger || !panel) return;
      const triggerRect = trigger.getBoundingClientRect();
      const panelWidth = panel.offsetWidth;
      const viewportLeft = clampPanelLeft({
        triggerLeft: triggerRect.left,
        triggerWidth: triggerRect.width,
        panelWidth,
        viewportWidth: window.innerWidth,
        gutter: VIEWPORT_GUTTER_PX,
      });
      // Convert the viewport-relative target to the panel's parent frame.
      const parent = trigger.parentElement;
      const parentLeft = parent ? parent.getBoundingClientRect().left : 0;
      setPanelLeftPx(viewportLeft - parentLeft);
    }
    reposition();
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("resize", reposition);
    };
  }, [openId]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  function focusFirstPanelItem(id: string) {
    // Defer one frame so the panel has mounted before we query it.
    requestAnimationFrame(() => {
      const panel = panelRefs.current[id];
      panel?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    });
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLAnchorElement>, id: string, hasChildren: boolean) {
    if (!hasChildren) return;
    // ArrowDown and Space open the submenu and move focus into the first
    // subcategory link. Enter is intentionally left alone so it still
    // activates the Link and navigates to the parent category page.
    if (e.key === "ArrowDown" || e.key === " ") {
      e.preventDefault();
      setOpenId(id);
      focusFirstPanelItem(id);
    }
  }

  function onPanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>, id: string) {
    const panel = panelRefs.current[id];
    if (!panel) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      const items = Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitem"]'));
      if (!items.length) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = items.findIndex((el) => el === active);
      let next = idx;
      if (e.key === "ArrowDown") next = idx < 0 ? 0 : (idx + 1) % items.length;
      else if (e.key === "ArrowUp") next = idx <= 0 ? items.length - 1 : idx - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = items.length - 1;
      e.preventDefault();
      items[next]?.focus();
    }
  }

  return (
    <nav aria-label="Primary" className="hidden min-w-0 items-center gap-1 xl:flex">
      {categories.map((c) => {
        const hasChildren = c.children.length > 0;
        const isOpen = openId === c.id;
        // 2-level panel mode when any child has grandchildren.
        const hasGrandchildren = c.children.some((sub) => sub.children && sub.children.length > 0);
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
              onKeyDown={(e) => onTriggerKeyDown(e, c.id, hasChildren)}
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-controls={hasChildren ? `megamenu-panel-${c.id}` : undefined}
            >
              {c.name}
              {hasChildren && <ChevronDown aria-hidden="true" className="h-3 w-3 opacity-60" />}
            </Link>
            {isOpen && hasChildren && (
              <div
                id={`megamenu-panel-${c.id}`}
                ref={(el) => {
                  panelRefs.current[c.id] = el;
                }}
                role="menu"
                aria-label={`${c.name} subcategories`}
                className={
                  hasGrandchildren
                    ? "absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 pt-2"
                    : "absolute left-1/2 top-full z-50 w-[480px] -translate-x-1/2 pt-2"
                }
                // Inline style overrides the Tailwind centering once we've
                // measured the viewport. The useLayoutEffect runs before paint
                // so the clamped position is applied in the same frame as the
                // panel's first appearance — no visible flicker.
                //
                // Both `transform` and `translate` must be reset: Tailwind v4
                // maps `-translate-x-1/2` to the modern CSS `translate`
                // property, not `transform`. Setting only `transform: "none"`
                // leaves `translate: -50% 0` in effect and the panel renders
                // at (clamped-left − panelWidth/2) — exactly the browser
                // audit's reported offset.
                style={
                  panelLeftPx != null
                    ? { left: `${panelLeftPx}px`, transform: "none", translate: "none" }
                    : undefined
                }
                onKeyDown={(e) => onPanelKeyDown(e, c.id)}
              >
                <div className="rounded-xl border border-brand-line bg-ivory p-5 shadow-lg shadow-charcoal/5">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h4 className="brand-wordmark text-sm text-gold-deep">{c.name}</h4>
                    <Link role="menuitem" href={`/c${c.path}`} className="text-[11px] font-medium uppercase tracking-wider text-brand-muted hover:text-charcoal">
                      View all →
                    </Link>
                  </div>
                  {hasGrandchildren ? (
                    <ul className="grid grid-cols-3 gap-x-6 gap-y-5">
                      {c.children.map((sub) => (
                        <li key={sub.id} className="min-w-0">
                          <Link
                            role="menuitem"
                            href={`/c${sub.path}`}
                            className="block rounded px-2 py-1 text-sm font-semibold text-charcoal hover:bg-champagne/50 hover:text-gold-deep"
                          >
                            {sub.name}
                          </Link>
                          {sub.children && sub.children.length > 0 && (
                            <ul className="mt-1 space-y-0.5 border-l border-brand-line pl-2">
                              {sub.children.map((gc) => (
                                <li key={gc.id}>
                                  <Link
                                    role="menuitem"
                                    href={`/c${gc.path}`}
                                    className="block rounded px-2 py-0.5 text-xs text-charcoal/80 hover:bg-champagne/50 hover:text-gold-deep"
                                  >
                                    {gc.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
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
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
