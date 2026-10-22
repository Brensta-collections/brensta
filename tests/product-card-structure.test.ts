/**
 * Structural regression guard for components/ui/ProductCard.tsx.
 * The audit at commit a884101 reported the "nested <button> inside <Link>" fix as applied,
 * but ProductCard was not updated to use WishlistButton. The real fix landed later
 * (together with the preload prop). This test fails if the file ever regresses to the
 * original pattern.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CARD = readFileSync(resolve(__dirname, "..", "components", "ui", "ProductCard.tsx"), "utf8");
const GRID = readFileSync(resolve(__dirname, "..", "components", "storefront", "ProductGrid.tsx"), "utf8");

describe("ProductCard structure", () => {
  it("imports and renders WishlistButton", () => {
    expect(CARD).toMatch(/from ["']\.\/WishlistButton["']/);
    expect(CARD).toMatch(/<WishlistButton\b/);
  });

  it("does not nest a <button> directly inside the <Link> wrapper", () => {
    // Collapse whitespace and find the <Link>…</Link> region.
    const flat = CARD.replace(/\s+/g, " ");
    const linkMatch = flat.match(/<Link[^>]*>(.*?)<\/Link>/);
    expect(linkMatch, "ProductCard must contain a <Link>").toBeTruthy();
    const inside = linkMatch![1];
    // The inert hand-rolled wishlist <button> previously placed inside the Link had
    // aria-label="Add to wishlist" — guard specifically against that reappearing.
    expect(inside).not.toMatch(/aria-label=["']Add to wishlist["']/);
    expect(inside).not.toMatch(/<button[^>]*>/);
  });

  it("accepts an optional inWishlist prop", () => {
    expect(CARD).toMatch(/inWishlist\?\s*:\s*boolean/);
    expect(CARD).toMatch(/initialActive=\{\s*inWishlist\s*\}/);
  });
});

describe("ProductGrid structure", () => {
  it("accepts optional inWishlistIds and forwards it per card", () => {
    expect(GRID).toMatch(/inWishlistIds\?\s*:\s*Set<string>/);
    expect(GRID).toMatch(/inWishlist=\{\s*inWishlistIds\?\.has\(p\.id\)\s*\}/);
  });
});
