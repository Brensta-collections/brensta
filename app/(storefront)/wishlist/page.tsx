import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUserId, getWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/ui/ProductCard";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const userId = await getCurrentUserId();
  const items = await getWishlist();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="Your wishlist is empty"
          description={userId
            ? "Save pieces you love and come back later."
            : "Save pieces you love — your wishlist stays with this browser, and we'll link it to your account when you sign in."
          }
          cta={{ label: "Browse Shop", href: "/shop" }}
          icon={<Heart className="h-6 w-6" />}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Wishlist</h1>
          <p className="mt-1 text-xs text-brand-muted">
            {items.length} item{items.length === 1 ? "" : "s"}
            {!userId && " · saved in this browser"}
          </p>
        </div>
        {!userId && (
          <Link href="/login?next=/wishlist" className="text-xs font-semibold uppercase tracking-wider text-gold-deep hover:text-charcoal">
            Sign in to keep your wishlist across devices →
          </Link>
        )}
      </header>
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
        {items.map((w) => (
          <ProductCard key={w.id} product={{ ...w.product, images: w.product.images, variants: w.product.variants }} inWishlist />
        ))}
      </div>
    </div>
  );
}
