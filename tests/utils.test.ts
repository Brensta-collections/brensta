import { describe, it, expect } from "vitest";
import { formatINR, slugify, cn } from "@/lib/utils";

describe("formatINR", () => {
  it("formats whole INR with the ₹ symbol", () => {
    const out = formatINR(1299);
    expect(out).toMatch(/₹/);
    expect(out).toMatch(/1,299/);
  });
});

describe("slugify", () => {
  it("lowercases, dashes and strips punctuation", () => {
    expect(slugify("Pearl & Gold Earrings!")).toBe("pearl-gold-earrings");
    expect(slugify("  Co-ord  Set  ")).toBe("co-ord-set");
  });
});

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
