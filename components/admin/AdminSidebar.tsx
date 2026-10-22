"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, MessageSquare, Star, TicketPercent, ImageIcon, Settings, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";

const groups: Array<{ title: string; items: Array<{ href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> }> = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/products/import", label: "Import / Export", icon: Upload },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit log", icon: FileText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-brand-line bg-ivory p-4 md:block">
      <div className="mb-6 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/" className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted hover:text-charcoal">Store →</Link>
      </div>
      <nav className="space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{g.title}</p>
            <ul className="mt-1.5 space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                        active ? "bg-charcoal text-ivory" : "text-charcoal hover:bg-champagne/50"
                      )}
                    >
                      <it.icon className="h-4 w-4" />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
