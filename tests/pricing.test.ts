import { describe, it, expect } from "vitest";
import { productDisplayPrice, discountPct, totalStock } from "@/lib/pricing";

describe("productDisplayPrice", () => {
  it("returns base price when no sale and no variants", () => {
    const r = productDisplayPrice({ basePrice: 1000, baseSalePrice: null });
    expect(r.price).toBe(1000);
    expect(r.list).toBeUndefined();
    expect(r.onSale).toBe(false);
  });

  it("returns sale price with list when discounted", () => {
    const r = productDisplayPrice({ basePrice: 1000, baseSalePrice: 700 });
    expect(r.price).toBe(700);
    expect(r.list).toBe(1000);
    expect(r.onSale).toBe(true);
  });

  it("uses variant min effective price when variants given", () => {
    const r = productDisplayPrice({ basePrice: 999, baseSalePrice: null }, [
      { price: 1200, salePrice: 999 },
      { price: 800, salePrice: null },
      { price: 1500, salePrice: 1300 },
    ]);
    expect(r.price).toBe(800);
    // onSale is false because the min effective (800) equals the min list (800)
    expect(r.onSale).toBe(false);
    expect(r.list).toBeUndefined();
  });

  it("flags onSale when every variant has a discount", () => {
    const r = productDisplayPrice({ basePrice: 999, baseSalePrice: null }, [
      { price: 1200, salePrice: 999 },
      { price: 1500, salePrice: 1200 },
    ]);
    expect(r.price).toBe(999);
    expect(r.onSale).toBe(true);
    expect(r.list).toBe(1200);
  });
});

describe("discountPct", () => {
  it("computes integer percent", () => {
    expect(discountPct(1000, 700)).toBe(30);
    expect(discountPct(500, 499)).toBe(0); // rounds down
    expect(discountPct(0, 0)).toBe(0);
  });
});

describe("totalStock", () => {
  it("sums variant stock", () => {
    expect(totalStock([{ stock: 3 }, { stock: 5 }, { stock: 2 }])).toBe(10);
    expect(totalStock([])).toBe(0);
  });
});
