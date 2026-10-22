"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { deleteCategory, reorderCategory, setCategoryStatus } from "@/lib/admin/categories";

type Node = {
  id: string;
  name: string;
  path: string;
  depth: number;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  childCount: number;
};

export function CategoryTree({ nodes }: { nodes: Node[] }) {
  const [pending, startTransition] = useTransition();

  async function onDelete(n: Node) {
    if (n.childCount || n.productCount) {
      alert(`Cannot delete "${n.name}" — it has ${n.childCount} subcategor${n.childCount === 1 ? "y" : "ies"} and ${n.productCount} product${n.productCount === 1 ? "" : "s"}.`);
      return;
    }
    if (!confirm(`Delete "${n.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteCategory(n.id);
      if (!r?.ok) alert(r?.error ?? "Could not delete.");
    });
  }

  function toggleHidden(n: Node) {
    startTransition(async () => {
      await setCategoryStatus(n.id, n.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED");
    });
  }

  return (
    <ul className="divide-y divide-brand-line">
      {nodes.map((n) => (
        <li key={n.id} className="flex items-center justify-between gap-3 py-2.5" style={{ paddingLeft: `${n.depth * 20}px` }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-charcoal">{n.name}</span>
              {n.status !== "PUBLISHED" && <Badge variant={n.status === "DRAFT" ? "neutral" : "soldout"}>{n.status}</Badge>}
            </div>
            <p className="font-mono text-[11px] text-brand-muted">{n.path}</p>
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-brand-muted md:flex">
            <span>{n.childCount} sub</span>
            <span>{n.productCount} prod</span>
          </div>
          <div className="flex items-center gap-1 text-brand-muted">
            <button type="button" disabled={pending} onClick={() => startTransition(() => reorderCategory(n.id, -1).then(() => undefined))} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" disabled={pending} onClick={() => startTransition(() => reorderCategory(n.id, 1).then(() => undefined))} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
            <button type="button" disabled={pending} onClick={() => toggleHidden(n)} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Toggle visibility">
              {n.status === "PUBLISHED" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <Link href={`/admin/categories/${n.id}`} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
            <button type="button" disabled={pending} onClick={() => onDelete(n)} className="rounded p-1.5 hover:bg-warm-brown/10 hover:text-warm-brown" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}
