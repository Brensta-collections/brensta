"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, ChevronRight, LogOut, User } from "lucide-react";
import type { CategoryWithChildren } from "@/lib/categories";
import { Logo } from "./Logo";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNav({ categories }: { categories: CategoryWithChildren[] }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  // Remember the category id that opened the submenu so Back can restore focus
  // to the correct button. We store the id (not the DOM node) because the main
  // list is unmounted while the submenu is visible — a captured HTMLElement
  // would point at an orphaned node by the time we try to .focus() it.
  const openerCategoryIdRef = useRef<string | null>(null);

  const drawerId = useId();
  const titleId = useId();
  const active = categories.find((c) => c.id === activeId);
  const signedIn = !!session?.user;

  // Scroll-lock the background while the drawer is open. Save + restore the
  // previous overflow value so we don't fight any other code that may have
  // set it (e.g. the mega menu — though it does not today).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Move focus into the drawer on open. Depends on `open` only — must NOT
  // re-run on `activeId` changes, otherwise opening a submenu or going Back
  // would briefly focus the first focusable (the <Logo> "BRENSTA home" link)
  // before openSubmenu / closeSubmenu's queued rAF can land focus on the
  // intended target.
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const first = drawer.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
  }, [open]);

  // Keyboard handling: Escape closes the whole drawer (fully resetting
  // submenu state so the next open starts at the main list) and Tab is
  // trapped inside the drawer. The handler queries live DOM on every press,
  // so this effect does not need activeId in its deps.
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        // Reset submenu state so reopening the drawer always starts at
        // the main category list.
        openerCategoryIdRef.current = null;
        setActiveId(null);
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(drawer!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const activeEl = document.activeElement as HTMLElement | null;
      const idx = activeEl ? items.indexOf(activeEl) : -1;
      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        }
      } else {
        if (idx === -1 || idx === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // On every close path, restore focus to the hamburger trigger. Guard
  // against the initial mount case (open=false since the beginning) — we
  // only restore focus when the drawer actually transitioned open → closed.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    triggerRef.current?.focus({ preventScroll: true });
  }, [open]);

  function closeDrawer() {
    setOpen(false);
    setActiveId(null);
    openerCategoryIdRef.current = null;
  }

  function openSubmenu(id: string) {
    openerCategoryIdRef.current = id;
    setActiveId(id);
    // Defer focus to next frame so the submenu has rendered.
    requestAnimationFrame(() => {
      const back = drawerRef.current?.querySelector<HTMLElement>('[data-mobilenav-back="true"]');
      back?.focus();
    });
  }

  function closeSubmenu() {
    const openerId = openerCategoryIdRef.current;
    openerCategoryIdRef.current = null;
    setActiveId(null);
    // Re-query the freshly mounted category button by data-attribute — a DOM
    // reference captured before setActiveId(null) would be stale because the
    // main list is remounted on this transition.
    requestAnimationFrame(() => {
      if (!openerId) return;
      const sel = `[data-mobilenav-category="${CSS.escape(openerId)}"]`;
      drawerRef.current?.querySelector<HTMLElement>(sel)?.focus();
    });
  }

  const drawer = open && (
    <div
      className="fixed inset-0 z-[60] flex xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      id={drawerId}
    >
      <div className="flex-1 bg-charcoal/40" onClick={closeDrawer} aria-hidden="true" />
      <div
        ref={drawerRef}
        className="flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-ivory p-5 shadow-xl"
      >
        <h2 id={titleId} className="sr-only">Site navigation</h2>
        <div className="mb-6 flex items-center justify-between">
          <Logo size="sm" />
          <button
            type="button"
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            onClick={closeDrawer}
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
                  data-mobilenav-category={c.id}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-charcoal hover:bg-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  onClick={() =>
                    c.children.length ? openSubmenu(c.id) : closeDrawer()
                  }
                >
                  <span>{c.name}</span>
                  {c.children.length > 0 && <ChevronRight className="h-4 w-4" />}
                </button>
              </li>
            ))}
            <li className="mt-6 border-t border-brand-line pt-4">
              <Link href="/search" className="block px-4 py-2 text-sm" onClick={closeDrawer}>Search</Link>
              <Link href="/wishlist" className="block px-4 py-2 text-sm" onClick={closeDrawer}>Wishlist</Link>
              <Link href="/cart" className="block px-4 py-2 text-sm" onClick={closeDrawer}>Cart</Link>
              {status === "loading" ? null : signedIn ? (
                <>
                  <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-sm" onClick={closeDrawer}>
                    <User className="h-4 w-4" aria-hidden="true" /> My Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      void signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" className="block px-4 py-2 text-sm" onClick={closeDrawer}>Sign in</Link>
              )}
            </li>
          </ul>
        ) : (
          <div>
            <button
              type="button"
              data-mobilenav-back="true"
              className="mb-4 inline-flex items-center gap-2 text-sm text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              onClick={closeSubmenu}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back
            </button>
            <h3 className="brand-wordmark text-xl text-gold-deep">{active.name}</h3>
            <Link
              href={`/c${active.path}`}
              className="mt-2 block text-sm font-medium text-charcoal underline-offset-4 hover:underline"
              onClick={closeDrawer}
            >
              Shop all {active.name}
            </Link>
            <ul className="mt-4 space-y-1">
              {active.children.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/c${sub.path}`}
                    onClick={closeDrawer}
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
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-haspopup="dialog"
        className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold xl:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {/* Portal to <body> so the fixed-position drawer escapes the header's
          backdrop-filter containing block (which was clipping it to 64px).
          `open` starts false, so this branch is never taken during SSR or
          the first client render — document.body is always defined by the
          time the user clicks the hamburger. */}
      {drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
