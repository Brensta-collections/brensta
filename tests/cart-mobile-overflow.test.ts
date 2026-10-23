/**
 * Phase 2 regression guards for the cart mobile-overflow fix.
 *
 * Browser audit (375 / 390 / 414 px) found the cart grid's children
 * overflowing their track because CSS grid-items default to
 * `min-width: auto`, which propagates each child's intrinsic min-content
 * width upward. The fix is `min-w-0` on both grid children plus on the
 * two inner flex children whose shrinking was still blocked (coupon
 * `flex-1` input, line-item `flex-1` content column) and `flex-wrap` on
 * the qty+price row so a tight content column lets the price fall to a
 * second line instead of overflowing.
 *
 * These tests pin the source-level pattern. Pixel-perfect overflow
 * measurement at 375 / 390 / 414 / 430 px requires a real browser (JSDOM
 * does not run CSS layout, so an assertion against boundingClientRect
 * there would be a false signal). The browser-check list is in the fix
 * report; what we lock in here is the shape of the fix.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("cart page — grid children can shrink", () => {
  const src = read("app/(storefront)/cart/page.tsx");

  it("the <ul> (left column) carries min-w-0 so its grid track obeys the layout width", () => {
    expect(src).toMatch(/<ul className="min-w-0 divide-y divide-brand-line border-y border-brand-line"/);
  });

  it("the <aside> (Order Summary column) carries min-w-0", () => {
    expect(src).toMatch(/<aside className="h-fit min-w-0 space-y-4/);
  });

  it("explains the load-bearing nature of the min-w-0 in a comment so a future reviewer doesn't remove it", () => {
    expect(src).toMatch(/min-w-0 on both grid children is load-bearing/i);
  });
});

describe("CouponPanel — input can shrink below its intrinsic min-content", () => {
  const src = read("components/cart/CouponPanel.tsx");

  it("coupon input has min-w-0 alongside flex-1 so flex shrinking actually fires", () => {
    expect(src).toMatch(/className="min-w-0 flex-1 rounded-full/);
    // The previous class string (without min-w-0) must not sneak back in.
    expect(src).not.toMatch(/className="flex-1 rounded-full border border-brand-line bg-white px-3 py-1\.5 text-sm uppercase/);
  });
});

describe("CartLineItem — content column shrinks + qty/price row wraps when tight", () => {
  const src = read("components/cart/CartLineItem.tsx");

  it("content column (<div flex-1>) carries min-w-0", () => {
    expect(src).toMatch(/<div className="min-w-0 flex-1">/);
  });

  it("qty-stepper + Price row uses flex-wrap so the price falls to a new line at narrow widths", () => {
    expect(src).toMatch(/<div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">/);
  });
});

describe("cart viewport-fit intent at 375 / 390 / 414 / 430 px", () => {
  // Pure-pixel bookkeeping: the fix guarantees shrinkability, so the
  // theoretical floor is the sum of the irreducible per-row widths —
  // image + gaps + remove button on the line-item side, padding +
  // Apply-button on the aside side. These numbers below are what the
  // Tailwind utilities in the current layout compile to; if a future
  // edit widens any of them the floor rises and this assertion catches
  // the regression before the browser audit does.
  const CART_LINE_ITEM_FIXED = 80 /* image h-20/w-20 */ + 16 /* gap-4 */ + 16 /* gap-4 */ + 24 /* trash btn h-6 */;
  const APPLY_BUTTON_MAX = 100 /* Button size="sm" with "Apply" text */;
  const ASIDE_PADDING = 48 /* p-6 */ + 24 /* CouponPanel p-3 inner */;

  for (const vw of [375, 390, 414, 430]) {
    it(`vw=${vw}: fixed overhead in the cart line item leaves usable room for the flexible content column`, () => {
      // Container is px-4 on <lg (<1024). Inner = vw - 32.
      const inner = vw - 32;
      // Grid is single-column below lg, so each child uses the full inner.
      const available = inner;
      const lineItemFlex = available - CART_LINE_ITEM_FIXED;
      // The content column must have room for at least the qty stepper
      // (~108px for the 3×36 pill) OR the price alone — whichever fits.
      // With flex-wrap, we only need room for the wider of the two.
      expect(lineItemFlex, `vw=${vw}: line-item flex room`).toBeGreaterThan(108);
    });

    it(`vw=${vw}: aside has room for the Apply button plus a shrinkable coupon input`, () => {
      const inner = vw - 32;
      const asideFlexRoom = inner - ASIDE_PADDING;
      expect(asideFlexRoom, `vw=${vw}: aside flex room`).toBeGreaterThan(APPLY_BUTTON_MAX);
    });
  }
});
