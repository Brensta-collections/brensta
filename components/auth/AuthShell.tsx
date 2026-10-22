import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <div className="mb-8 flex justify-center">
        <Logo size="md" />
      </div>
      <div className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm md:p-8">
        <h1 className="brand-wordmark text-2xl text-charcoal">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-center text-xs text-brand-muted">{footer}</p>}
      <p className="mt-4 text-center text-[11px] text-brand-muted">
        <Link href="/">← Back to BRENSTA</Link>
      </p>
    </div>
  );
}
