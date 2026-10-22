"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addToCart } from "@/lib/cart";
import { toggleWishlist } from "@/lib/wishlist";

type Variant = {
  id: string;
  stock: number;
  optionValues: Record<string, string>;
};

export function ProductActions({ productId, variants, productName }: { productId: string; variants: Variant[]; productName: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const variant = variants.find((v) => v.id === selectedId) ?? null;
  const maxQty = variant?.stock ?? 1;
  const outOfStock = (variant?.stock ?? 0) <= 0;

  const optionKeys = variants[0] ? Object.keys(variants[0].optionValues) : [];

  function onAdd() {
    if (!variant) return;
    startTransition(async () => {
      const r = await addToCart(variant.id, qty);
      if (r.ok) setMsg("Added to cart.");
      else setMsg(r.error);
    });
  }

  function onWishlist() {
    startTransition(async () => {
      const r = await toggleWishlist(productId);
      if (!r.ok && r.error === "SIGNIN_REQUIRED") setMsg("Please sign in to use wishlist (coming in Milestone 4).");
      else if (r.ok) setMsg(r.added ? "Added to wishlist." : "Removed from wishlist.");
    });
  }

  return (
    <div className="space-y-5">
      {/* Variant pickers */}
      {optionKeys.map((key) => {
        const values = Array.from(new Set(variants.map((v) => v.optionValues[key])));
        if (values.length <= 1) return null;
        return (
          <div key={key}>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{key}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {values.map((val) => {
                const matching = variants.find((v) => v.optionValues[key] === val);
                const active = variant?.optionValues[key] === val;
                const disabled = !matching || matching.stock <= 0;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={disabled}
                    onClick={() => matching && setSelectedId(matching.id)}
                    className={`min-w-[2.5rem] rounded-full border px-3 py-1.5 text-sm transition ${
                      active ? "border-charcoal bg-charcoal text-ivory" : "border-brand-line bg-white text-charcoal hover:border-gold"
                    } ${disabled ? "line-through opacity-40" : ""}`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Quantity */}
      {!outOfStock && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Quantity</p>
          <div className="mt-2 inline-flex items-center rounded-full border border-brand-line bg-white">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease" className="h-10 w-10 text-charcoal">−</button>
            <span className="w-10 text-center text-sm font-medium">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase" className="h-10 w-10 text-charcoal">+</button>
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

      {msg && <p className="text-xs text-brand-muted" role="status">{msg}</p>}
      <p className="sr-only" aria-live="polite">{productName}</p>
    </div>
  );
}
