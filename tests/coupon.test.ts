import { describe, it, expect } from "vitest";
import { calcCouponDiscount, couponFormSchema } from "@/lib/validators/coupon";

const base = { isActive: true, code: "T", type: "PERCENT" as const, value: 10 };

describe("calcCouponDiscount", () => {
  it("applies percent", () => {
    const r = calcCouponDiscount({ ...base, type: "PERCENT", value: 10 }, { subtotal: 1000 });
    expect(r).toEqual({ ok: true, discount: 100 });
  });
  it("caps percent at maxDiscount", () => {
    const r = calcCouponDiscount({ ...base, type: "PERCENT", value: 50, maxDiscount: 200 }, { subtotal: 1000 });
    expect(r).toEqual({ ok: true, discount: 200 });
  });
  it("applies flat", () => {
    const r = calcCouponDiscount({ ...base, type: "FLAT", value: 150 }, { subtotal: 1000 });
    expect(r).toEqual({ ok: true, discount: 150 });
  });
  it("rejects below minOrder", () => {
    const r = calcCouponDiscount({ ...base, minOrder: 2000 }, { subtotal: 999 });
    expect(r.ok).toBe(false);
  });
  it("rejects when inactive", () => {
    const r = calcCouponDiscount({ ...base, isActive: false }, { subtotal: 1000 });
    expect(r.ok).toBe(false);
  });
  it("rejects when expired", () => {
    const r = calcCouponDiscount({ ...base, endsAt: new Date("2020-01-01") }, { subtotal: 1000 });
    expect(r.ok).toBe(false);
  });
  it("rejects when per-user limit reached", () => {
    const r = calcCouponDiscount(base, { subtotal: 1000, perUserLimit: 1, userRedemptions: 1 });
    expect(r.ok).toBe(false);
  });
  it("rejects when global limit reached", () => {
    const r = calcCouponDiscount(base, { subtotal: 1000, globalLimit: 10, globalRedemptions: 10 });
    expect(r.ok).toBe(false);
  });
  it("rejects when category filter does not match", () => {
    const r = calcCouponDiscount({ ...base, appliesToCategoryIds: ["cat-x"] }, { subtotal: 1000, cartCategoryIds: ["cat-y"] });
    expect(r.ok).toBe(false);
  });
  it("accepts when category filter matches", () => {
    const r = calcCouponDiscount({ ...base, appliesToCategoryIds: ["cat-x"] }, { subtotal: 1000, cartCategoryIds: ["cat-x", "cat-y"] });
    expect(r.ok).toBe(true);
  });
  it("caps discount at subtotal", () => {
    const r = calcCouponDiscount({ ...base, type: "FLAT", value: 5000 }, { subtotal: 1200 });
    expect(r.ok && r.discount).toBe(1200);
  });
});

describe("couponFormSchema", () => {
  it("rejects percent > 90", () => {
    const r = couponFormSchema.safeParse({ code: "A1", type: "PERCENT", value: 95 });
    expect(r.success).toBe(false);
  });
  it("rejects end-before-start", () => {
    const r = couponFormSchema.safeParse({ code: "A1", type: "FLAT", value: 100, startsAt: "2026-01-02", endsAt: "2026-01-01" });
    expect(r.success).toBe(false);
  });
  it("accepts a valid payload", () => {
    const r = couponFormSchema.safeParse({ code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 500 });
    expect(r.success).toBe(true);
  });
});
