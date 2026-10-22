import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  products: React.ComponentProps<typeof ProductCard>["product"][];
  /** Set of product ids already saved to the viewer's wishlist. Used to preload the heart state. */
  inWishlistIds?: Set<string>;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductGrid({ products, inWishlistIds, emptyTitle = "No products found", emptyDescription = "Try adjusting filters or search terms." }: Props) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} cta={{ label: "Shop All", href: "/shop" }} />;
  }
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} inWishlist={inWishlistIds?.has(p.id)} />
      ))}
    </div>
  );
}
