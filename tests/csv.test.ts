import { describe, it, expect } from "vitest";
import { parseCsv, toCsv } from "@/lib/admin/csv";

describe("CSV parser", () => {
  it("parses a simple CSV", () => {
    const txt = "name,sku,price\nShirt,ABC-1,999\nSaree,DEF-2,2499";
    const rows = parseCsv(txt);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ name: "Shirt", sku: "ABC-1", price: "999" });
  });
  it("handles quoted commas and escaped quotes", () => {
    const txt = 'name,desc\n"Red, pleated kurti","She said ""hi"""';
    const rows = parseCsv(txt);
    expect(rows[0]).toEqual({ name: "Red, pleated kurti", desc: 'She said "hi"' });
  });
  it("ignores blank trailing lines", () => {
    const rows = parseCsv("a,b\n1,2\n\n");
    expect(rows).toHaveLength(1);
  });
  it("round-trips through toCsv()", () => {
    const data = [{ name: "Linen Top", desc: "Light, breezy" }, { name: "Silk Scarf", desc: "" }];
    const csv = toCsv(data);
    const parsed = parseCsv(csv);
    expect(parsed).toEqual([{ name: "Linen Top", desc: "Light, breezy" }, { name: "Silk Scarf", desc: "" }]);
  });
});
