import Link from "next/link";

export function AdminPageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="brand-wordmark text-2xl text-charcoal md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

export function Crumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-brand-muted">
      <Link href="/admin" className="hover:text-charcoal">Admin</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <span>/</span>
          {it.href ? <Link href={it.href} className="hover:text-charcoal">{it.label}</Link> : <span className="text-charcoal">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
