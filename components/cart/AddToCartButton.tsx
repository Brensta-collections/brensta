"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addToCart } from "@/lib/cart";
import { toggleWishlist } from "@/lib/wishlist";

type Variant = {
  id: string;
  sku: string;
  stock: number;
  optionValues: Record<string, string>;
};

export function ProductActions({ productId, variants, productName }: { productId: string; variants: Variant[]; productName: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null);
  const [rawQty, setRawQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const variant = variants.find((v) => v.id === selectedId) ?? null;
  const maxQty = Math.max(1, variant?.stock ?? 1);
  const outOfStock = (variant?.stock ?? 0) <= 0;
  // Clamp qty against the currently-selected variant's stock on every render.
  // Avoids effect-driven setState and the extra render cycle it would cause.
  const qty = Math.min(Math.max(1, rawQty), maxQty);

  const optionKeys = variants[0] ? Object.keys(variants[0].optionValues) : [];

  function selectVariant(id: string) {
    setSelectedId(id);
    // reset qty when switching variants
    setRawQty(1);
  }

  function onAdd() {
    if (!variant) return;
    const safeQty = Math.min(qty, variant.stock);
    startTransition(async () => {
      const r = await addToCart(variant.id, safeQty);
      if (r.ok) setMsg(`Added ${safeQty} to cart.`);
      else setMsg(r.error);
    });
  }

  function onWishlist() {
    startTransition(async () => {
      const r = await toggleWishlist(productId);
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      setMsg(r.added ? "Added to wishlist." : "Removed from wishlist.");
    });
  }

  return (
    <div className="space-y-5">
      {/* Variant pickers — accessible fieldset per option */}
      {optionKeys.map((key) => {
        const values = Array.from(new Set(variants.map((v) => v.optionValues[key])));
        if (values.length <= 1) return null;
        return (
          <fieldset key={key}>
            <legend className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{key}</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={key}>
              {values.map((val) => {
                const matching = variants.find((v) => v.optionValues[key] === val);
                const active = variant?.optionValues[key] === val;
                const disabled = !matching || matching.stock <= 0;
                return (
                  <button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${key} ${val}${disabled ? " (unavailable)" : ""}`}
                    disabled={disabled}
                    onClick={() => matching && selectVariant(matching.id)}
                    className={`min-w-[2.5rem] rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      active ? "border-charcoal bg-charcoal text-ivory" : "border-brand-line bg-white text-charcoal hover:border-gold"
                    } ${disabled ? "line-through opacity-40" : ""}`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* SKU for the selected variant */}
      {variant && (
        <p className="text-[11px] text-brand-muted">
          SKU: <span className="font-mono text-charcoal/80">{variant.sku}</span>
        </p>
      )}

      {/* Quantity */}
      {!outOfStock && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-muted" htmlFor="qty">Quantity</label>
          <div className="mt-2 inline-flex items-center rounded-full border border-brand-line bg-white">
            <button type="button" onClick={() => setRawQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="h-10 w-10 text-charcoal disabled:opacity-40" disabled={qty <= 1}>−</button>
            <input
              id="qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setRawQty(Number(e.target.value) || 1)}
              className="w-12 bg-transparent text-center text-sm font-medium focus:outline-none"
              aria-label="Quantity"
            />
            <button type="button" onClick={() => setRawQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity" className="h-10 w-10 text-charcoal disabled:opacity-40" disabled={qty >= maxQty}>+</button>
          </div>
          {variant && variant.stock <= 5 && variant.stock > 0 && (
            <p className="mt-2 text-xs text-warm-brown">Only {variant.stock} left in stock.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="gold" size="lg" onClick={onAdd} disabled={!variant || outOfStock || pending} className="flex-1">
          <ShoppingBag className="h-4 w-4" />
          {outOfStock ? "Sold Out" : pending ? "Adding…" : "Add to Cart"}
        </Button>
        <Button variant="outline" size="lg" onClick={onWishlist} disabled={pending} className="flex-1">
          <Heart className="h-4 w-4" />
          Wishlist
        </Button>
      </div>

      {msg && <p className="text-xs text-brand-muted" role="status" aria-live="polite">{msg}</p>}
      <p className="sr-only">{productName}</p>
    </div>
  );
}
