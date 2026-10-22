"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

/**
 * Floating wishlist button for product cards.
 * Positioned absolutely inside the card (sibling of the Link, NOT nested in it)
 * so clicking it never navigates to the product page.
 */
export function WishlistButton({ productId, size = "sm", initialActive = false }: { productId: string; size?: "sm" | "md"; initialActive?: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMsg(null);
    startTransition(async () => {
      const r = await toggleWishlist(productId);
      if (!r.ok) {
        if (r.error === "SIGNIN_REQUIRED") {
          router.push(`/login?next=/wishlist`);
          return;
        }
        setMsg("Something went wrong.");
        return;
      }
      setActive(r.added);
    });
  }

  const sizeCls = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={active}
        disabled={pending}
        className={cn(
          "absolute right-2 top-2 z-10 flex items-center justify-center rounded-full bg-ivory/90 shadow-sm transition hover:bg-gold hover:text-ivory",
          sizeCls,
          active ? "text-warm-brown" : "text-charcoal"
        )}
      >
        <Heart className={cn("h-4 w-4", active ? "fill-warm-brown" : "")} />
      </button>
      {msg && <span className="sr-only" role="status">{msg}</span>}
    </>
  );
}
