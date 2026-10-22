import { describe, it, expect } from "vitest";
import { renderPolicyMarkdown } from "@/lib/markdown";

describe("policy markdown renderer", () => {
  it("renders headings and paragraphs", () => {
    const out = renderPolicyMarkdown("# Title\n\nHello **world**.");
    expect(out).toMatch(/<h1[^>]*>Title<\/h1>/);
    expect(out).toMatch(/<strong>world<\/strong>/);
  });
  it("escapes raw HTML in input", () => {
    const out = renderPolicyMarkdown("<script>alert(1)</script>");
    expect(out).not.toMatch(/<script>/);
    expect(out).toMatch(/&lt;script&gt;/);
  });
  it("renders lists", () => {
    const out = renderPolicyMarkdown("- one\n- two\n- three");
    expect(out).toMatch(/<ul[^>]*>[\s\S]*<li[^>]*>one<\/li>/);
  });
  it("renders tables", () => {
    const out = renderPolicyMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |");
    expect(out).toMatch(/<table/);
    expect(out).toMatch(/<th[^>]*>A<\/th>/);
    expect(out).toMatch(/<td[^>]*>2<\/td>/);
  });
  it("renders links with safe href", () => {
    const out = renderPolicyMarkdown("[local](/x) and [bad](javascript:1)");
    expect(out).toMatch(/href="\/x"/);
    expect(out).toMatch(/href="#"/);
  });
});
