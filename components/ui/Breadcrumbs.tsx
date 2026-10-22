import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: Array<{ name: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-brand-muted">
      <Link href="/" className="hover:text-charcoal">Home</Link>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {item.href && idx < items.length - 1 ? (
            <Link href={item.href} className="hover:text-charcoal">{item.name}</Link>
          ) : (
            <span className="font-medium text-charcoal">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
