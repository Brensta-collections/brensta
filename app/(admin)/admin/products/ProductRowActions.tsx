"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Copy, Edit, Eye, EyeOff, Archive } from "lucide-react";
import { duplicateProduct, setProductStatus } from "@/lib/admin/products";
import type { PublishStatus } from "@prisma/client";

export function ProductRowActions({ id, slug, status }: { id: string; slug: string; status: PublishStatus }) {
  const [pending, startTransition] = useTransition();

  function go(action: "publish" | "unpublish" | "archive" | "duplicate") {
    startTransition(async () => {
      if (action === "duplicate") await duplicateProduct(id);
      else if (action === "publish") await setProductStatus(id, "PUBLISHED");
      else if (action === "unpublish") await setProductStatus(id, "DRAFT");
      else if (action === "archive") {
        if (!confirm("Archive this product? It will be hidden from the storefront.")) return;
        await setProductStatus(id, "ARCHIVED");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1 text-brand-muted">
      <Link href={`/p/${slug}`} target="_blank" className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="View on store"><Eye className="h-4 w-4" /></Link>
      <Link href={`/admin/products/${id}`} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
      <button type="button" disabled={pending} onClick={() => go("duplicate")} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
      {status === "PUBLISHED" ? (
        <button type="button" disabled={pending} onClick={() => go("unpublish")} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Unpublish"><EyeOff className="h-4 w-4" /></button>
      ) : (
        <button type="button" disabled={pending} onClick={() => go("publish")} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Publish"><Eye className="h-4 w-4" /></button>
      )}
      {status !== "ARCHIVED" && (
        <button type="button" disabled={pending} onClick={() => go("archive")} className="rounded p-1.5 hover:bg-champagne/50 hover:text-warm-brown" aria-label="Archive"><Archive className="h-4 w-4" /></button>
      )}
    </div>
  );
}
