import { cn } from "@/lib/utils";

export function FormField({
  label,
  error,
  id,
  children,
  hint,
}: {
  label: string;
  error?: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-[11px] text-brand-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-warm-brown">{error}</p>}
    </div>
  );
}

export const inputCls = cn(
  "block w-full rounded-lg border border-brand-line bg-ivory px-3 py-2.5 text-sm text-charcoal",
  "placeholder:text-brand-muted/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
);
