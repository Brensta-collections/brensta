import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "demo" | "sale" | "new" | "soldout" | "neutral";

export function Badge({ variant = "neutral", className, children }: { variant?: Variant; className?: string; children: React.ReactNode }) {
  const styles: Record<Variant, string> = {
    demo: "bg-charcoal text-ivory",
    sale: "bg-warm-brown text-ivory",
    new: "bg-gold text-charcoal",
    soldout: "bg-brand-muted/80 text-ivory",
    neutral: "bg-champagne text-charcoal",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", styles[variant], className)}>
      {children}
    </span>
  );
}
