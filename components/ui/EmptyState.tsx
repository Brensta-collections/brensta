import Link from "next/link";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  cta,
  icon,
}: {
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-brand-line bg-white/60 px-6 py-16 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-champagne/60 text-gold-deep">{icon}</div>}
      <h3 className="brand-wordmark text-2xl text-charcoal">{title}</h3>
      {description && <p className="mt-2 text-sm text-brand-muted">{description}</p>}
      {cta && (
        <Link href={cta.href} className="mt-6">
          <Button variant="primary">{cta.label}</Button>
        </Link>
      )}
    </div>
  );
}
