"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminTopbar({ userName, userEmail, role }: { userName: string; userEmail: string; role: string }) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-brand-line bg-white px-4 md:px-6">
      <div className="brand-wordmark text-sm text-brand-muted md:hidden">BRENSTA Admin</div>
      <div className="hidden md:block">
        <p className="text-[11px] uppercase tracking-wider text-brand-muted">Admin</p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/" className="hidden text-xs font-medium text-charcoal hover:text-gold-deep md:inline-block">View store</Link>
        <div className="hidden text-right md:block">
          <p className="text-xs font-semibold text-charcoal">{userName}</p>
          <p className="text-[11px] text-brand-muted">{userEmail} · {role}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex h-9 w-9 items-center justify-center rounded-md text-charcoal hover:bg-champagne/50"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
