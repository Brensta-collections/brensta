"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Edit, ChevronRight, ChevronDown } from "lucide-react";
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

type TreeNode = Node & { children: TreeNode[] };

/**
 * Expandable category tree. Preserves every row-level action from the flat
 * list (edit / hide / up / down / delete). Depth-0 roots start expanded;
 * depth-1 start collapsed. State lives only in the browser — refresh resets.
 */
export function CategoryTree({ nodes }: { nodes: Node[] }) {
  const [pending, startTransition] = useTransition();

  const roots = useMemo<TreeNode[]>(() => buildTree(nodes), [nodes]);

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Default: all depth-0 roots expanded, deeper nodes collapsed.
    const open = new Set<string>();
    for (const n of nodes) if (n.depth === 0) open.add(n.id);
    return open;
  });

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(nodes.map((n) => n.id)));
  }
  function collapseAll() {
    const roots = new Set(nodes.filter((n) => n.depth === 0).map((n) => n.id));
    setExpanded(roots);
  }

  async function onDelete(n: Node) {
    if (n.childCount || n.productCount) {
      alert(
        `Cannot delete "${n.name}" — it has ${n.childCount} subcategor${
          n.childCount === 1 ? "y" : "ies"
        } and ${n.productCount} product${n.productCount === 1 ? "" : "s"}.`,
      );
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
    <div>
      <div className="mb-2 flex items-center justify-end gap-2 text-[11px] text-brand-muted">
        <button type="button" onClick={expandAll} className="rounded px-2 py-1 hover:bg-champagne/50 hover:text-charcoal">
          Expand all
        </button>
        <button type="button" onClick={collapseAll} className="rounded px-2 py-1 hover:bg-champagne/50 hover:text-charcoal">
          Collapse to roots
        </button>
      </div>
      <ul className="divide-y divide-brand-line">
        {roots.map((n) => (
          <TreeRow
            key={n.id}
            node={n}
            expanded={expanded}
            onToggle={toggle}
            pending={pending}
            onDelete={onDelete}
            onToggleHidden={toggleHidden}
            onReorder={(id, dir) =>
              startTransition(() => reorderCategory(id, dir).then(() => undefined))
            }
          />
        ))}
      </ul>
    </div>
  );
}

function buildTree(flat: Node[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const n of flat) byId.set(n.id, { ...n, children: [] });
  const roots: TreeNode[] = [];
  for (const n of byId.values()) {
    if (n.parentId && byId.has(n.parentId)) {
      byId.get(n.parentId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  // Sort children by sortOrder, then name — same server-side convention.
  const sorter = (a: TreeNode, b: TreeNode) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const sortRecursive = (list: TreeNode[]) => {
    list.sort(sorter);
    for (const n of list) sortRecursive(n.children);
  };
  sortRecursive(roots);
  return roots;
}

function TreeRow({
  node,
  expanded,
  onToggle,
  pending,
  onDelete,
  onToggleHidden,
  onReorder,
}: {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  pending: boolean;
  onDelete: (n: Node) => void | Promise<void>;
  onToggleHidden: (n: Node) => void;
  onReorder: (id: string, dir: -1 | 1) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  return (
    <li>
      <div
        className="flex items-center justify-between gap-3 py-2.5"
        style={{ paddingLeft: `${node.depth * 20}px` }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                aria-expanded={isOpen}
                aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
                className="rounded p-0.5 text-brand-muted hover:bg-champagne/50 hover:text-charcoal"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="inline-block w-5" aria-hidden="true" />
            )}
            <span className="font-medium text-charcoal">{node.name}</span>
            {node.status !== "PUBLISHED" && (
              <Badge variant={node.status === "DRAFT" ? "neutral" : "soldout"}>{node.status}</Badge>
            )}
          </div>
          <p className="ml-5 font-mono text-[11px] text-brand-muted">{node.path}</p>
        </div>
        <div className="hidden items-center gap-3 text-[11px] text-brand-muted md:flex">
          <span>{node.childCount} sub</span>
          <span>{node.productCount} prod</span>
        </div>
        <div className="flex items-center gap-1 text-brand-muted">
          <button type="button" disabled={pending} onClick={() => onReorder(node.id, -1)} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" disabled={pending} onClick={() => onReorder(node.id, 1)} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
          <button type="button" disabled={pending} onClick={() => onToggleHidden(node)} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Toggle visibility">
            {node.status === "PUBLISHED" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <Link href={`/admin/categories/${node.id}`} className="rounded p-1.5 hover:bg-champagne/50 hover:text-charcoal" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
          <button type="button" disabled={pending} onClick={() => onDelete(node)} className="rounded p-1.5 hover:bg-warm-brown/10 hover:text-warm-brown" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      {hasChildren && isOpen && (
        <ul className="divide-y divide-brand-line">
          {node.children.map((c) => (
            <TreeRow
              key={c.id}
              node={c}
              expanded={expanded}
              onToggle={onToggle}
              pending={pending}
              onDelete={onDelete}
              onToggleHidden={onToggleHidden}
              onReorder={onReorder}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
