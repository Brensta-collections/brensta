import Link from "next/link";
import { Star } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listReviews } from "@/lib/admin/reviews";
import { ReviewRowActions } from "./ReviewRowActions";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = (sp.status as "ALL" | "PENDING" | "PUBLISHED" | "HIDDEN" | "REMOVED" | undefined) ?? "PENDING";
  const page = Math.max(1, Number(sp.page ?? 1));
  const { items, total } = await listReviews({ status, page });

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Reviews" subtitle={`${total} ${status === "ALL" ? "total" : status.toLowerCase()}`}>
        <div className="flex gap-1 text-xs">
          {(["PENDING", "PUBLISHED", "HIDDEN", "REMOVED", "ALL"] as const).map((s) => (
            <Link key={s} href={`/admin/reviews?status=${s}`} className={`rounded-full px-3 py-1 ${status === s ? "bg-charcoal text-ivory" : "bg-white text-charcoal hover:bg-champagne/50"}`}>
              {s}
            </Link>
          ))}
        </div>
      </AdminPageHeader>

      {items.length === 0 ? (
        <EmptyState title="No reviews in this view" />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border border-brand-line bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-gold text-gold" : "text-brand-line"}`} />
                      ))}
                    </div>
                    {r.isVerifiedPurchase && <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-deep">Verified purchase</span>}
                    <span className="rounded bg-champagne/60 px-2 py-0.5 text-[10px] font-semibold uppercase">{r.status}</span>
                  </div>
                  {r.title && <h3 className="mt-1.5 text-sm font-semibold text-charcoal">{r.title}</h3>}
                  <p className="mt-1 text-sm text-charcoal/80">{r.body}</p>
                  <p className="mt-2 text-[11px] text-brand-muted">
                    By {r.user.name ?? r.user.email} · on <Link href={`/p/${r.product.slug}`} className="underline underline-offset-4 hover:text-charcoal">{r.product.name}</Link> · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  {r.moderationReason && <p className="mt-1 text-[11px] text-warm-brown">Note: {r.moderationReason}</p>}
                </div>
                <ReviewRowActions id={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
