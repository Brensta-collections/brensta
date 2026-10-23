/**
 * Unit tests for lib/whatsapp (pure helpers) + source-level guards for
 * the FAB + the contact-page WhatsApp link wiring.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  WHATSAPP_GREETING,
  buildWhatsAppUrl,
  isValidWhatsAppNumber,
  normalizePhoneToDigits,
  whatsAppUrlFromSetting,
} from "@/lib/whatsapp";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("normalizePhoneToDigits", () => {
  it("strips +, spaces, dashes and parentheses", () => {
    expect(normalizePhoneToDigits("+91 93097 01804")).toBe("919309701804");
    expect(normalizePhoneToDigits("+91-9309701804")).toBe("919309701804");
    expect(normalizePhoneToDigits("(91) 93097-01804")).toBe("919309701804");
  });

  it("prepends 91 for 10-digit Indian mobiles starting 6–9", () => {
    expect(normalizePhoneToDigits("9309701804")).toBe("919309701804");
    expect(normalizePhoneToDigits("6309701804")).toBe("916309701804");
    expect(normalizePhoneToDigits("7309701804")).toBe("917309701804");
    expect(normalizePhoneToDigits("8309701804")).toBe("918309701804");
  });

  it("leaves 10-digit numbers whose first digit is not 6–9 alone (not an Indian mobile)", () => {
    expect(normalizePhoneToDigits("5309701804")).toBe("5309701804");
    expect(normalizePhoneToDigits("1309701804")).toBe("1309701804");
  });

  it("returns empty for garbage input", () => {
    expect(normalizePhoneToDigits("abc")).toBe("");
    expect(normalizePhoneToDigits("")).toBe("");
    expect(normalizePhoneToDigits("+--- ---")).toBe("");
  });
});

describe("isValidWhatsAppNumber", () => {
  it("accepts a normalised Indian international number", () => {
    expect(isValidWhatsAppNumber("919309701804")).toBe(true);
  });

  it("rejects numbers that are too short", () => {
    expect(isValidWhatsAppNumber("9309701804")).toBe(false); // 10 digits
    expect(isValidWhatsAppNumber("")).toBe(false);
  });

  it("rejects numbers longer than the ITU 15-digit maximum", () => {
    expect(isValidWhatsAppNumber("1234567890123456")).toBe(false); // 16 digits
  });

  it("rejects an all-zero string", () => {
    expect(isValidWhatsAppNumber("00000000000")).toBe(false);
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a bare wa.me URL when no message is supplied", () => {
    expect(buildWhatsAppUrl("919309701804")).toBe("https://wa.me/919309701804");
  });

  it("appends ?text=<encoded> when a message is supplied", () => {
    expect(buildWhatsAppUrl("919309701804", "Hi there")).toBe(
      "https://wa.me/919309701804?text=Hi%20there",
    );
  });

  it("URL-encodes punctuation inside the greeting (commas and spaces)", () => {
    const url = buildWhatsAppUrl("919309701804", WHATSAPP_GREETING);
    expect(url.startsWith("https://wa.me/919309701804?text=")).toBe(true);
    // Must not emit a raw space or comma in the URL — those break wa.me.
    const text = url.split("?text=")[1];
    expect(text).not.toContain(" ");
    expect(text).not.toContain(",");
    // Round-trip decode gets us the original greeting back.
    expect(decodeURIComponent(text)).toBe(WHATSAPP_GREETING);
  });
});

describe("whatsAppUrlFromSetting — placeholder-safe pipeline", () => {
  it("returns null for null / undefined / empty / whitespace values", () => {
    expect(whatsAppUrlFromSetting(null)).toBeNull();
    expect(whatsAppUrlFromSetting(undefined)).toBeNull();
    expect(whatsAppUrlFromSetting("")).toBeNull();
  });

  it("returns null for the seeded +91-00000-00000 placeholder", () => {
    expect(whatsAppUrlFromSetting("+91-00000-00000")).toBeNull();
  });

  it("returns null for the [PLACEHOLDER] marker", () => {
    expect(whatsAppUrlFromSetting("[PLACEHOLDER]")).toBeNull();
    expect(whatsAppUrlFromSetting("[PLACEHOLDER — add WhatsApp number]")).toBeNull();
  });

  it("returns a usable wa.me URL for the owner-published number in several accepted shapes", () => {
    const expected = `https://wa.me/919309701804?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
    expect(whatsAppUrlFromSetting("+91 9309701804", WHATSAPP_GREETING)).toBe(expected);
    expect(whatsAppUrlFromSetting("+919309701804", WHATSAPP_GREETING)).toBe(expected);
    expect(whatsAppUrlFromSetting("91 9309701804", WHATSAPP_GREETING)).toBe(expected);
    expect(whatsAppUrlFromSetting("9309701804", WHATSAPP_GREETING)).toBe(expected);
    expect(whatsAppUrlFromSetting("+91-93097-01804", WHATSAPP_GREETING)).toBe(expected);
  });

  it("omits the text parameter when no greeting is supplied", () => {
    expect(whatsAppUrlFromSetting("+91 9309701804")).toBe("https://wa.me/919309701804");
  });

  it("returns null when the normalised digits are too short to be a WhatsApp account", () => {
    expect(whatsAppUrlFromSetting("12345")).toBeNull();
  });
});

describe("WhatsAppFab — floating button wiring", () => {
  const src = read("components/layout/WhatsAppFab.tsx");

  it("reads from the owner-managed contact.whatsapp Setting (no hardcoded number)", () => {
    expect(src).toContain('key: "contact.whatsapp"');
    // No hardcoded phone number anywhere in the component source.
    expect(src).not.toMatch(/\b9309701804\b/);
    expect(src).not.toMatch(/https:\/\/wa\.me\/\d/);
  });

  it("delegates URL construction and placeholder handling to the pure helper", () => {
    expect(src).toContain('whatsAppUrlFromSetting');
    expect(src).toContain('WHATSAPP_GREETING');
  });

  it("renders nothing when the helper returns null (owner has not published yet)", () => {
    expect(src).toMatch(/if \(!url\) return null;/);
  });

  it("renders a fixed-position anchor with target=_blank + rel=noopener noreferrer", () => {
    expect(src).toMatch(/<a[\s\S]+?href=\{url\}/);
    expect(src).toMatch(/target="_blank"/);
    expect(src).toMatch(/rel="noopener noreferrer"/);
    expect(src).toMatch(/className="fixed[^"]*bottom-4[^"]*right-4/);
  });

  it("exposes an accessible name on the anchor and marks the icon aria-hidden", () => {
    expect(src).toMatch(/aria-label="Chat with BRENSTA on WhatsApp"/);
    expect(src).toMatch(/aria-hidden="true"/);
  });
});

describe("StorefrontLayout — mounts the FAB on every storefront page", () => {
  const src = read("app/(storefront)/layout.tsx");

  it("imports and renders <WhatsAppFab />", () => {
    expect(src).toContain('import { WhatsAppFab } from "@/components/layout/WhatsAppFab"');
    expect(src).toMatch(/<WhatsAppFab \/>/);
  });
});

describe("Contact page — WhatsApp row becomes a clickable link", () => {
  const src = read("app/(storefront)/contact/page.tsx");

  it("imports and uses the pure helper (no hardcoded wa.me URL on the page)", () => {
    expect(src).toContain('whatsAppUrlFromSetting');
    expect(src).toContain('WHATSAPP_GREETING');
    expect(src).not.toMatch(/https:\/\/wa\.me\//);
    expect(src).not.toMatch(/\b9309701804\b/);
  });

  it("renders the WhatsApp row only when both the display value AND the href are usable", () => {
    expect(src).toMatch(/\{whatsapp && whatsappHref && \(/);
  });

  it("passes href + external onto ContactLine for new-tab semantics", () => {
    expect(src).toMatch(/<ContactLine[\s\S]+?label="WhatsApp"[\s\S]+?href=\{whatsappHref\}[\s\S]+?external/);
  });

  it("ContactLine with external=true emits target=_blank + rel=noopener noreferrer", () => {
    expect(src).toMatch(/target: "_blank", rel: "noopener noreferrer"/);
  });
});
