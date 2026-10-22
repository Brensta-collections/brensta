import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUserId, getWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/ui/ProductCard";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="Sign in to save favourites"
          description="Your wishlist travels with your account. Sign-in and personal accounts arrive in Milestone 4."
          cta={{ label: "Browse Shop", href: "/shop" }}
          icon={<Heart className="h-6 w-6" />}
        />
      </div>
    );
  }
  const items = await getWishlist(userId);
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState title="Your wishlist is empty" description="Save pieces you love and come back later." cta={{ label: "Browse Shop", href: "/shop" }} icon={<Heart className="h-6 w-6" />} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
        {items.map((w) => (
          <ProductCard key={w.id} product={{ ...w.product, images: w.product.images, variants: w.product.variants }} />
        ))}
      </div>
    </div>
  );
}
