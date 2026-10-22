import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { getMainCategoriesWithChildren } from "@/lib/categories";
import { getCartCount } from "@/lib/cart";
import { getSessionUserId } from "@/lib/auth-helpers";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { HeaderSearch } from "./HeaderSearch";
import { AccountMenu } from "./AccountMenu";

export async function Header() {
  const userId = await getSessionUserId();
  const [categories, cartCount] = await Promise.all([
    getMainCategoriesWithChildren(),
    getCartCount(userId).catch(() => 0),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-ivory/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 md:gap-4 md:px-6">
        {/* Left — menu + logo. shrink-0 is load-bearing: without it the logo
            was shrinking and overlapping the MegaMenu at ~1024–1279. */}
        <div className="flex shrink-0 items-center gap-1 md:gap-4">
          <MobileNav categories={categories} />
          <Logo size="md" />
        </div>

        {/* Center — mega menu. Shown only at xl+ (≥1280). Below that we rely
            on the hamburger (MobileNav) so the header never has to fit
            logo + 5-item nav + full search + account label in one row. */}
        <MegaMenu categories={categories} />

        {/* Right — actions. Progressive reveal to avoid overflow at 768–1023 */}
        <div className="flex shrink-0 items-center gap-0.5 md:gap-2">
          {/* Full search appears only at lg+ (≥1024). Below lg we show the compact icon. */}
          <HeaderSearch />
          <HeaderSearch compact />
          <AccountMenu />
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
