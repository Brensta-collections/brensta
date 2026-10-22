import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/rbac";

export default async function AuditPage() {
  await requireAdmin();
  const items = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { user: { select: { name: true, email: true } } },
  });
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Audit log" subtitle={`${items.length} most recent events`} />
      <div className="overflow-hidden rounded-xl border border-brand-line bg-white">
        <table className="min-w-full divide-y divide-brand-line">
          <thead className="bg-ivory text-left text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Before → After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line text-sm">
            {items.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{new Date(e.createdAt).toLocaleString("en-IN")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{e.user?.name ?? e.user?.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-gold-deep">{e.action}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{e.entityType} <span className="font-mono text-brand-muted">{e.entityId ?? ""}</span></td>
                <td className="px-4 py-3 text-[11px] text-brand-muted">
                  {e.before && <code className="block whitespace-pre-wrap text-charcoal/70">before: {JSON.stringify(e.before)}</code>}
                  {e.after && <code className="block whitespace-pre-wrap text-charcoal/70">after:  {JSON.stringify(e.after)}</code>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
