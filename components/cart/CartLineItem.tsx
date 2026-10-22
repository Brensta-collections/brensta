"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Price } from "@/components/ui/Price";
import { removeFromCart, updateCartItemQty } from "@/lib/cart";

type Item = {
  id: string;
  qty: number;
  snapshotPrice: number;
  productSlug: string;
  productName: string;
  variantOptionLabel: string;
  stock: number;
  imageUrl: string | null;
};

export function CartLineItem({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  const isPlaceholder = !item.imageUrl || item.imageUrl.startsWith("placeholder:");

  return (
    <li className="flex items-start gap-4 border-b border-brand-line py-5">
      <Link href={`/p/${item.productSlug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded border border-brand-line bg-champagne/30 md:h-24 md:w-24">
        {isPlaceholder ? (
          <PlaceholderImage seed={item.productSlug} label={item.productName} aspect="square" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl!} alt={item.productName} className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="flex-1">
        <Link href={`/p/${item.productSlug}`} className="line-clamp-2 text-sm font-medium text-charcoal hover:text-gold-deep">
          {item.productName}
        </Link>
        {item.variantOptionLabel && (
          <p className="mt-0.5 text-xs text-brand-muted">{item.variantOptionLabel}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-brand-line bg-white">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => updateCartItemQty(item.id, item.qty - 1))}
              aria-label="Decrease"
              className="h-9 w-9 text-charcoal disabled:opacity-50"
            >−</button>
            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
            <button
              type="button"
              disabled={pending || item.qty >= item.stock}
              onClick={() => startTransition(() => updateCartItemQty(item.id, item.qty + 1))}
              aria-label="Increase"
              className="h-9 w-9 text-charcoal disabled:opacity-50"
            >+</button>
          </div>
          <Price price={item.snapshotPrice * item.qty} size="sm" />
        </div>
      </div>
      <button
        type="button"
        aria-label="Remove"
        disabled={pending}
        onClick={() => startTransition(() => removeFromCart(item.id))}
        className="text-brand-muted hover:text-warm-brown"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
