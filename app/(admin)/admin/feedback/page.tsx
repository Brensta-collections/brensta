import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listFeedback } from "@/lib/admin/feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackRow } from "./FeedbackRow";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = (sp.status as "ALL" | "NEW" | "REPLIED" | "CLOSED" | undefined) ?? "NEW";
  const page = Math.max(1, Number(sp.page ?? 1));
  const { items, total } = await listFeedback({ status, page });
  return (
    <div className="space-y-5">
      <AdminPageHeader title="Feedback inbox" subtitle={`${total} ${status === "ALL" ? "total" : status.toLowerCase()}`} />
      {items.length === 0 ? <EmptyState title="No feedback here." /> : (
        <ul className="space-y-3">
          {items.map((f) => (
            <FeedbackRow
              key={f.id}
              f={{
                id: f.id,
                name: f.name,
                email: f.email,
                subject: f.subject,
                body: f.body,
                status: f.status,
                reply: f.reply,
                createdAt: f.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
