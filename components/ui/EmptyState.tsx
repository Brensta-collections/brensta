import { LinkButton } from "./LinkButton";

export function EmptyState({
  title,
  description,
  cta,
  icon,
  as = "h3",
}: {
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  icon?: React.ReactNode;
  /** Heading tag — pass "h1" when this is the only heading on the page (empty cart/wishlist). */
  as?: "h1" | "h2" | "h3";
}) {
  const Heading = as;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-brand-line bg-white/60 px-6 py-16 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-champagne/60 text-gold-deep">{icon}</div>}
      <Heading className="brand-wordmark text-2xl text-charcoal">{title}</Heading>
      {description && <p className="mt-2 text-sm text-brand-muted">{description}</p>}
      {cta && (
        <LinkButton href={cta.href} variant="primary" className="mt-6">{cta.label}</LinkButton>
      )}
    </div>
  );
}
