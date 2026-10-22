/**
 * Group G regression guards: owner-supplied contact facts replace placeholders
 * across the storefront, policy pages and contact page — without touching
 * the DB-backed Settings rows. Legal/business claims that still require the
 * owner's decision stay as explicit [PLACEHOLDER] markers.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BUSINESS_EMAIL, BUSINESS_PHONE_DISPLAY, BUSINESS_PHONE_TEL, isPlaceholderContact } from "@/lib/business";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("lib/business owner-supplied contact constants", () => {
  it("exposes the exact owner-supplied email", () => {
    expect(BUSINESS_EMAIL).toBe("brensta.business@gmail.com");
  });
  it("exposes a human-readable + a tel-link phone form", () => {
    expect(BUSINESS_PHONE_DISPLAY).toBe("+91 93097 01804");
    expect(BUSINESS_PHONE_TEL).toBe("+919309701804");
  });
});

describe("isPlaceholderContact", () => {
  it("flags empty, null and undefined", () => {
    expect(isPlaceholderContact("")).toBe(true);
    expect(isPlaceholderContact(null)).toBe(true);
    expect(isPlaceholderContact(undefined)).toBe(true);
  });
  it("flags seeded placeholders", () => {
    expect(isPlaceholderContact("[PLACEHOLDER]")).toBe(true);
    expect(isPlaceholderContact("[PLACEHOLDER — add registered business address]")).toBe(true);
    expect(isPlaceholderContact("+91-00000-00000")).toBe(true);
    expect(isPlaceholderContact("support@brensta.local")).toBe(true);
  });
  it("accepts a real value", () => {
    expect(isPlaceholderContact("brensta.business@gmail.com")).toBe(false);
    expect(isPlaceholderContact("+91 93097 01804")).toBe(false);
    expect(isPlaceholderContact("12 Example Street, Mumbai")).toBe(false);
  });
});

describe("Contact page wires the fallbacks", () => {
  const src = read("app/(storefront)/contact/page.tsx");
  it("imports BUSINESS_EMAIL and the placeholder helper", () => {
    expect(src).toContain('import { BUSINESS_EMAIL, BUSINESS_PHONE_DISPLAY, BUSINESS_PHONE_TEL, isPlaceholderContact } from "@/lib/business"');
  });
  it("falls back to BUSINESS_EMAIL / BUSINESS_PHONE_DISPLAY when the DB value is a placeholder", () => {
    expect(src).toMatch(/isPlaceholderContact\(contact\.email\) \? BUSINESS_EMAIL : contact\.email/);
    expect(src).toMatch(/isPlaceholderContact\(contact\.phone\) \? BUSINESS_PHONE_DISPLAY : contact\.phone/);
  });
  it("does NOT fabricate a WhatsApp number or address — those render only when the admin publishes a non-placeholder value", () => {
    expect(src).toMatch(/isPlaceholderContact\(contact\.whatsapp\) \? null : contact\.whatsapp/);
    expect(src).toMatch(/isPlaceholderContact\(contact\.address\) \? null : contact\.address/);
    expect(src).toMatch(/registered office address will appear here once the business owner publishes it/i);
  });
  it("drops the unsupported one-working-day response SLA", () => {
    expect(src).not.toContain("respond within one working day");
    expect(src).toContain("We aim to reply as soon as possible");
  });
  it("still uses sanitized links (mailto + tel) for the real contact rows", () => {
    expect(src).toMatch(/href=\{`mailto:\$\{email\}`\}/);
    expect(src).toMatch(/href=\{`tel:\$\{phoneTel\}`\}/);
  });
});

describe("Policy drafts resolve the contact placeholders", () => {
  const src = read("lib/policies.ts");

  it("imports the business constants", () => {
    expect(src).toContain('import { BUSINESS_EMAIL, BUSINESS_PHONE_DISPLAY } from "@/lib/business"');
  });

  it("Privacy §1 names the real email + phone via template substitution", () => {
    expect(src).toMatch(/You can reach us at \$\{BUSINESS_EMAIL\} or \$\{BUSINESS_PHONE_DISPLAY\}/);
  });

  it("Privacy §5 (DPDP rights) uses the real email", () => {
    expect(src).toMatch(/Write to \$\{BUSINESS_EMAIL\} and we will respond/);
  });

  it("Returns points at the real email for return requests", () => {
    expect(src).toMatch(/write to \$\{BUSINESS_EMAIL\}/);
  });

  it("Grievance block names the real email + phone (officer, address, SLAs still placeholders)", () => {
    expect(src).toMatch(/\*\*Email:\*\* \$\{BUSINESS_EMAIL\}/);
    expect(src).toMatch(/\*\*Phone:\*\* \$\{BUSINESS_PHONE_DISPLAY\}/);
    expect(src).toMatch(/\*\*Grievance Officer:\*\* _\[PLACEHOLDER — name\]_/);
    expect(src).toMatch(/\*\*Address:\*\* _\[PLACEHOLDER — registered business address\]_/);
  });

  it("FAQ 'how do I contact you' uses the real contact details", () => {
    expect(src).toMatch(/Write to \$\{BUSINESS_EMAIL\}, call \$\{BUSINESS_PHONE_DISPLAY\}/);
  });

  it("FAQ no longer claims a specific 5–7 day delivery timeline", () => {
    expect(src).not.toContain("Delivery is typically 5–7 working days from dispatch");
    expect(src).toContain("will be finalised with our courier partners before launch");
  });

  it("still leaves business-decision placeholders in place (legal entity, address, courier SLAs, return window, jurisdiction)", () => {
    expect(src).toContain("[PLACEHOLDER — legal entity name]");
    expect(src).toContain("[PLACEHOLDER — registered business address]");
    expect(src).toContain("[PLACEHOLDER — jurisdiction]");
    expect(src).toContain("[PLACEHOLDER — e.g. 5–7 working days]");
    expect(src).toContain("[PLACEHOLDER — e.g. 7 days from delivery]");
    expect(src).toContain("[PLACEHOLDER — SLA, typically 15–30 days]");
  });

  it("does NOT invent GSTIN, DPIIT, CIN or other statutory identifiers", () => {
    // Lightly stress-test: any attempt to inline these would show up as a
    // digit-run adjacent to a label.
    expect(src).not.toMatch(/GSTIN:\s*[0-9A-Z]{15}/);
    expect(src).not.toMatch(/CIN:\s*[A-Z]{1}\d{5}/);
    expect(src).not.toMatch(/DPIIT[^.]+\d{6,}/);
  });
});

describe("Product page trust badges no longer claim specific SLAs", () => {
  const src = read("app/(storefront)/p/[slug]/page.tsx");
  it("drops 'Delivery 5–7 days' and 'Easy 7-day return'", () => {
    expect(src).not.toContain("Delivery 5–7 days");
    expect(src).not.toContain("Easy 7-day return");
  });
  it("defers to the policy pages via links", () => {
    expect(src).toMatch(/href="\/p\/policies\/shipping"[^>]*>\s*<Truck[\s\S]*?Delivery across India/);
    expect(src).toMatch(/href="\/p\/policies\/returns"[^>]*>\s*<RotateCcw[\s\S]*?Returns per our policy/);
  });
});
