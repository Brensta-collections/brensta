import { describe, it, expect } from "vitest";
import { pluralize } from "@/lib/utils";

describe("pluralize", () => {
  it("renders singular at count 1", () => {
    expect(pluralize(1, "item")).toBe("1 item");
    expect(pluralize(1, "result")).toBe("1 result");
  });
  it("renders plural at 0 and >1", () => {
    expect(pluralize(0, "item")).toBe("0 items");
    expect(pluralize(2, "item")).toBe("2 items");
    expect(pluralize(27, "product")).toBe("27 products");
  });
  it("accepts a custom plural form", () => {
    expect(pluralize(1, "child", "children")).toBe("1 child");
    expect(pluralize(3, "child", "children")).toBe("3 children");
  });
  it("treats -1 as singular", () => {
    expect(pluralize(-1, "item")).toBe("-1 item");
  });
});
