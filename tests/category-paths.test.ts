import { describe, it, expect } from "vitest";
import { categoryFormSchema } from "@/lib/validators/category";

describe("categoryFormSchema", () => {
  it("accepts a basic payload", () => {
    const r = categoryFormSchema.safeParse({ name: "Earrings", slug: "earrings", status: "PUBLISHED" });
    expect(r.success).toBe(true);
  });
  it("rejects slug with uppercase", () => {
    const r = categoryFormSchema.safeParse({ name: "Earrings", slug: "Earrings", status: "DRAFT" });
    expect(r.success).toBe(false);
  });
  it("rejects slug starting with a dash", () => {
    const r = categoryFormSchema.safeParse({ name: "x", slug: "-hello", status: "DRAFT" });
    expect(r.success).toBe(false);
  });
});
