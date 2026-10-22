"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { User, Package, MapPin, Heart, Lock, LogOut } from "lucide-react";

const items = [
  { href: "/account", label: "Overview", icon: User, exact: true },
  { href: "/account/profile", label: "My Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "My Addresses", icon: MapPin },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/change-password", label: "Change Password", icon: Lock },
];

export function AccountSidebar() {
  const pathname = usePathname();
  return (
    <aside className="rounded-xl border border-brand-line bg-white p-3 md:sticky md:top-24 md:p-4">
      <nav className="space-y-1">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                active ? "bg-charcoal text-ivory" : "text-charcoal hover:bg-champagne/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-charcoal hover:bg-champagne/50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </nav>
    </aside>
  );
}
