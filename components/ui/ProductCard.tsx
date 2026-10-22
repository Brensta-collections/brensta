import Link from "next/link";
import Image from "next/image";
import { PlaceholderImage } from "./PlaceholderImage";
import { Badge } from "./Badge";
import { Price } from "./Price";
import { WishlistButton } from "./WishlistButton";
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
  /** Initial active state for the wishlist heart. Pass true if this product is already in the viewer's wishlist. */
  inWishlist?: boolean;
};

export function ProductCard({ product, inWishlist = false }: Props) {
  const { price, list, onSale } = productDisplayPrice(product, product.variants);
  const stock = totalStock(product.variants);
  const img = product.images[0];
  const isPlaceholder = !img || img.url.startsWith("placeholder:");

  return (
    // `relative` lets the WishlistButton position itself over the image without being nested in the Link.
    <article className="group relative">
      {/* Floating heart — sibling of the Link, so clicks never navigate to the product page. */}
      <WishlistButton productId={product.id} initialActive={inWishlist} />
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
            {isPlaceholder && <Badge variant="demo">DEMO</Badge>}
            {onSale && <Badge variant="sale">Sale</Badge>}
            {product.isNewArrival && <Badge variant="new">New</Badge>}
            {stock === 0 && <Badge variant="soldout">Sold Out</Badge>}
          </div>
        </div>
        <div className="mt-3 px-1">
          <h3 className="line-clamp-2 text-sm font-medium text-charcoal transition-colors group-hover:text-gold-deep">{product.name}</h3>
          <div className="mt-1">
            <Price price={price} list={list} onSale={onSale} size="sm" />
          </div>
        </div>
      </Link>
    </article>
  );
}
