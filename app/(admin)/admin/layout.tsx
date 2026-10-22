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
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopbar userName={user.name ?? "Admin"} userEmail={user.email} role={user.role} />
        <main className="flex-1 bg-ivory/70 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
