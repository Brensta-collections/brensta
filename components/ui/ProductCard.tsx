import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { PlaceholderImage } from "./PlaceholderImage";
import { Badge } from "./Badge";
import { Price } from "./Price";
import { productDisplayPrice, totalStock } from "@/lib/pricing";
import type { Prisma } from "@prisma/client";

type Variant = { id: string; price: Prisma.Decimal | number | string; salePrice: Prisma.Decimal | number | string | null; stock: number };

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    basePrice: Prisma.Decimal | number | string;
    baseSalePrice: Prisma.Decimal | number | string | null;
    isNewArrival: boolean;
    images: Array<{ url: string; alt: string | null }>;
    variants: Variant[];
  };
};

export function ProductCard({ product }: Props) {
  const { price, list, onSale } = productDisplayPrice(product, product.variants);
  const stock = totalStock(product.variants);
  const img = product.images[0];
  const isPlaceholder = !img || img.url.startsWith("placeholder:");

  return (
    <article className="group">
      <Link href={`/p/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-champagne/40">
          {isPlaceholder ? (
            <PlaceholderImage seed={product.slug} label={product.name} aspect="portrait" />
          ) : (
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={img.url}
                alt={img.alt ?? product.name}
                fill
                sizes="(max-width:768px) 50vw, (max-width:1200px) 25vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <Badge variant="demo">DEMO</Badge>
            {onSale && <Badge variant="sale">Sale</Badge>}
            {product.isNewArrival && <Badge variant="new">New</Badge>}
            {stock === 0 && <Badge variant="soldout">Sold Out</Badge>}
          </div>
          <button
            type="button"
            aria-label="Add to wishlist"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-charcoal shadow-sm transition hover:bg-gold hover:text-ivory"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </Link>
      <div className="mt-3 px-1">
        <Link href={`/p/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-charcoal hover:text-gold-deep">{product.name}</h3>
        </Link>
        <div className="mt-1">
          <Price price={price} list={list} onSale={onSale} size="sm" />
        </div>
      </div>
    </article>
  );
}
