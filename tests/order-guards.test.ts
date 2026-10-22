/**
 * Group H: source-level guards for the critical order-placement path. The
 * full flow depends on Prisma + a running DB (covered by cancel-order and
 * stock-race integration tests); these are repo-wide invariants that catch
 * accidental removal of a security-critical line.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("lib/orders.ts placeOrder — critical invariants", () => {
  const src = read("lib/orders.ts");

  it("rejects ONLINE payment until Razorpay is wired (M6)", () => {
    expect(src).toMatch(/paymentMethod === "ONLINE"[\s\S]{0,200}Milestone 6/);
  });

  it("validates the server-recomputed total against the client-sent expected total", () => {
    expect(src).toMatch(/expectedTotalPaise !== expectedPaise/);
    expect(src).toMatch(/Prices or availability have changed/);
  });

  it("verifies address ownership before using it", () => {
    expect(src).toMatch(/address\.userId !== userId/);
  });

  it("idempotency key: existing order with a different userId is rejected", () => {
    expect(src).toMatch(/existing\.userId !== userId/);
  });

  it("uses conditional updateMany for atomic stock decrement (no SELECT-then-UPDATE race)", () => {
    expect(src).toMatch(/updateMany\(\{\s*where:\s*\{[^}]*stock:\s*\{\s*gte:\s*item\.qty\s*\}[^}]*isActive:\s*true/);
    expect(src).toMatch(/update\.count === 0[\s\S]{0,100}INSUFFICIENT_STOCK/);
  });

  it("re-reads live variant prices server-side rather than trusting the client", () => {
    expect(src).toMatch(/prisma\.productVariant\.findMany/);
    // The authoritative subtotal is accumulated from live-variant unit prices.
    expect(src).toMatch(/let subtotal = 0/);
  });
});
