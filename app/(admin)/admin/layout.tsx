import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/rbac";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "Admin · %s · BRENSTA" },
  // Admin surface must never be indexed, even in production.
  robots: { index: false, follow: false, nocache: true, nosnippet: true, noimageindex: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar />
      {/* min-w-0 is load-bearing: without it the flex child defaults to
          min-width: auto and a wide child (e.g. the products table) forces the
          whole content column to overflow the viewport, pushing the topbar
          controls — "View store", "Import" — off-screen. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar userName={user.name ?? "Admin"} userEmail={user.email} role={user.role} />
        <main className="min-w-0 flex-1 bg-ivory/70 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
