import { formatINR } from "@/lib/utils";
import { discountPct } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Price({ price, list, onSale, size = "md" }: { price: number; list?: number; onSale?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizeCls = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={cn("font-semibold text-charcoal", sizeCls)}>{formatINR(price)}</span>
      {onSale && list && (
        <>
          <span className="text-xs text-brand-muted line-through">{formatINR(list)}</span>
          <span className="rounded bg-warm-brown/10 px-1.5 py-0.5 text-[10px] font-semibold text-warm-brown">
            {discountPct(list, price)}% OFF
          </span>
        </>
      )}
    </div>
  );
}
