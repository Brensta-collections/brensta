"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Package, Heart, MapPin } from "lucide-react";

export function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <span className="hidden h-10 w-10 md:block" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" aria-label="Sign in" className="hidden h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep md:flex">
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div className="relative hidden md:block" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex h-10 items-center gap-1 rounded-md px-2 text-charcoal hover:text-gold-deep"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
      >
        <User className="h-5 w-5" />
        <span className="hidden text-sm font-medium lg:inline">Hi, {session.user.name?.split(" ")[0] ?? "You"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 w-56 pt-2">
          <div className="rounded-xl border border-brand-line bg-ivory p-2 shadow-lg shadow-charcoal/5">
            <Link href="/account" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <User className="h-4 w-4" /> My Account
            </Link>
            <Link href="/account/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <Package className="h-4 w-4" /> Orders
            </Link>
            <Link href="/account/addresses" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <MapPin className="h-4 w-4" /> Addresses
            </Link>
            <Link href="/wishlist" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50">
              <Heart className="h-4 w-4" /> Wishlist
            </Link>
            {(session.user.role === "ADMIN" || session.user.role === "STAFF") && (
              <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gold-deep hover:bg-champagne/50">
                Admin Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-charcoal hover:bg-champagne/50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
