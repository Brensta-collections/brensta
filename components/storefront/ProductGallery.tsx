"use client";

import Image from "next/image";
import { useState } from "react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

type Img = { url: string; alt: string | null };

export function ProductGallery({ productSlug, productName, images }: { productSlug: string; productName: string; images: Img[] }) {
  const list: Img[] = images.length > 0 ? images : [{ url: `placeholder:${productSlug}:1`, alt: productName }];
  const [active, setActive] = useState(0);
  const current = list[active];
  const isPlaceholder = current.url.startsWith("placeholder:");

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      <div className="flex flex-row gap-3 md:flex-col">
        {list.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Image ${i + 1}`}
            className={`relative h-16 w-16 overflow-hidden rounded border transition md:h-20 md:w-20 ${i === active ? "border-gold-deep" : "border-brand-line"}`}
          >
            {img.url.startsWith("placeholder:") ? (
              <PlaceholderImage seed={`${productSlug}-${i}`} label={productName} aspect="square" />
            ) : (
              <Image src={img.url} alt={img.alt ?? productName} fill sizes="80px" className="object-cover" />
            )}
          </button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl bg-champagne/40">
        {isPlaceholder ? (
          <PlaceholderImage seed={`${productSlug}-main-${active}`} label={productName} aspect="square" className="h-full w-full" />
        ) : (
          <div className="relative aspect-square w-full">
            <Image src={current.url} alt={current.alt ?? productName} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" priority />
          </div>
        )}
      </div>
    </div>
  );
}
