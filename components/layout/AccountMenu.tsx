"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Package, Heart, MapPin } from "lucide-react";

export function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape and restore focus to the trigger. Also close on outside click.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (status === "loading") {
    return <span className="hidden h-10 w-10 md:block" aria-hidden="true" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" aria-label="Sign in" className="hidden h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep md:flex">
        <User className="h-5 w-5" aria-hidden="true" />
      </Link>
    );
  }

  const firstName = session.user.name?.split(" ")[0] ?? "You";

  return (
    <div ref={containerRef} className="relative hidden md:block" onMouseLeave={() => setOpen(false)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account menu for ${firstName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex h-10 items-center gap-1 rounded-md px-2 text-charcoal hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
      >
        <User className="h-5 w-5" aria-hidden="true" />
        <span className="hidden text-sm font-medium lg:inline">Hi, {firstName}</span>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Account" className="absolute right-0 top-full z-40 w-56 pt-2">
          <div className="rounded-xl border border-brand-line bg-ivory p-2 shadow-lg shadow-charcoal/5">
            <Link role="menuitem" href="/account" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <User className="h-4 w-4" aria-hidden="true" /> My Account
            </Link>
            <Link role="menuitem" href="/account/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <Package className="h-4 w-4" aria-hidden="true" /> Orders
            </Link>
            <Link role="menuitem" href="/account/addresses" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <MapPin className="h-4 w-4" aria-hidden="true" /> Addresses
            </Link>
            <Link role="menuitem" href="/wishlist" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <Heart className="h-4 w-4" aria-hidden="true" /> Wishlist
            </Link>
            {(session.user.role === "ADMIN" || session.user.role === "STAFF") && (
              <Link role="menuitem" href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gold-deep hover:bg-champagne/50">
                Admin Dashboard
              </Link>
            )}
            <button
              role="menuitem"
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
