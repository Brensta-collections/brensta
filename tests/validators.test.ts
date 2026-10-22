import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, passwordSchema } from "@/lib/validators/auth";
import { addressSchema } from "@/lib/validators/address";
import { checkoutSchema } from "@/lib/validators/checkout";
import { rateLimit } from "@/lib/rate-limit";

describe("auth validators", () => {
  it("accepts strong passwords (letters + digits + 10+ chars)", () => {
    expect(passwordSchema.safeParse("Abcd1234ef").success).toBe(true);
  });
  it("rejects short or alpha-only passwords", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("allalphabetsnonumber").success).toBe(false);
    expect(passwordSchema.safeParse("1234567890").success).toBe(false);
  });
  it("register requires valid 10-digit mobile when supplied", () => {
    const ok = registerSchema.safeParse({ name: "Niharika", email: "n@a.com", phone: "9876543210", password: "Abcd1234ef" });
    expect(ok.success).toBe(true);
    const bad = registerSchema.safeParse({ name: "Niharika", email: "n@a.com", phone: "123", password: "Abcd1234ef" });
    expect(bad.success).toBe(false);
  });
  it("register trims+lowercases email", () => {
    const p = registerSchema.safeParse({ name: "A", email: "  FOO@Bar.com ", password: "Abcd1234ef" });
    expect(p.success).toBe(false); // name too short
    const p2 = registerSchema.safeParse({ name: "Ab", email: "  FOO@Bar.com ", password: "Abcd1234ef" });
    expect(p2.success).toBe(true);
    if (p2.success) expect(p2.data.email).toBe("foo@bar.com");
  });
  it("login requires both fields", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "not-email", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("address validators", () => {
  it("accepts a valid Indian address with 6-digit pincode and 10-digit mobile", () => {
    const r = addressSchema.safeParse({
      name: "Niharika Rao",
      phone: "9876543210",
      line1: "12, Marigold Residency, Lane 5",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411006",
    });
    expect(r.success).toBe(true);
  });
  it("rejects a 5-digit pincode", () => {
    const r = addressSchema.safeParse({ name: "x", phone: "9876543210", line1: "a a a", city: "P", state: "Maharashtra", pincode: "41106" });
    expect(r.success).toBe(false);
  });
  it("rejects a pincode starting with 0", () => {
    const r = addressSchema.safeParse({ name: "Na", phone: "9876543210", line1: "a a a", city: "P", state: "Maharashtra", pincode: "012345" });
    expect(r.success).toBe(false);
  });
  it("rejects an unknown state", () => {
    const r = addressSchema.safeParse({ name: "Na", phone: "9876543210", line1: "a a a", city: "P", state: "Narnia", pincode: "411006" });
    expect(r.success).toBe(false);
  });
  it("rejects mobile not starting with 6-9", () => {
    const r = addressSchema.safeParse({ name: "Na", phone: "1876543210", line1: "a a a", city: "P", state: "Maharashtra", pincode: "411006" });
    expect(r.success).toBe(false);
  });
});

describe("checkout validator", () => {
  it("requires addressId, paymentMethod, idempotencyKey, positive expectedTotalPaise", () => {
    const r = checkoutSchema.safeParse({
      addressId: "a1",
      paymentMethod: "COD",
      idempotencyKey: "idempo-key-abc-123",
      expectedTotalPaise: 99900,
    });
    expect(r.success).toBe(true);
  });
  it("rejects unknown payment method", () => {
    const r = checkoutSchema.safeParse({ addressId: "a1", paymentMethod: "GOLDBAR", idempotencyKey: "x".repeat(20), expectedTotalPaise: 1 });
    expect(r.success).toBe(false);
  });
});

describe("rate-limit", () => {
  it("allows up to limit then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60).allowed).toBe(true);
    }
    const r = rateLimit(key, 3, 60);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });
});
