import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";
import { getMainCategoriesWithChildren } from "@/lib/categories";
import { getCartCount } from "@/lib/cart";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { HeaderSearch } from "./HeaderSearch";

export async function Header() {
  const [categories, cartCount] = await Promise.all([
    getMainCategoriesWithChildren(),
    getCartCount().catch(() => 0),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-ivory/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileNav categories={categories} />
          <Logo size="md" />
        </div>

        <MegaMenu categories={categories} />

        <div className="flex items-center gap-1 md:gap-3">
          <HeaderSearch />
          <HeaderSearch compact />
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep md:flex"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative hidden h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep md:flex"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-charcoal hover:text-gold-deep"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-semibold text-ivory">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
