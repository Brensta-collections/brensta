/**
 * WhatsApp quick-contact helpers.
 *
 * The storefront reads the owner-published WhatsApp number from the DB
 * Setting `contact.whatsapp` (admin-managed via /admin/settings). This
 * module turns that raw string into a usable wa.me URL, with placeholder
 * detection + sanity checks so the UI can hide itself safely when the
 * admin has not yet published a real number.
 *
 * Pure — no DB, no React. Importable from both server and client code.
 */
import { isPlaceholderContact } from "@/lib/business";

/** Short pre-filled greeting opened in the WhatsApp chat. */
export const WHATSAPP_GREETING = "Hi BRENSTA, I'd like some help.";

/**
 * Strip everything that isn't a digit. If the result is a 10-digit Indian
 * mobile (starts 6–9), prepend the 91 country code — wa.me requires the
 * full international form (without a leading `+`).
 */
export function normalizePhoneToDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return "91" + digits;
  return digits;
}

/**
 * Sanity-check a normalized digit string before it becomes a wa.me target.
 * ITU-T caps international numbers at 15 digits; a usable WhatsApp
 * identifier always carries at least the country code + a 10-digit mobile
 * (≥ 11 digits for India / most countries). Placeholder detection lives
 * upstream in isPlaceholderContact.
 */
export function isValidWhatsAppNumber(digits: string): boolean {
  if (digits.length < 11 || digits.length > 15) return false;
  if (/^0+$/.test(digits)) return false;
  return true;
}

/**
 * Construct the wa.me deep-link. The optional pre-filled message is
 * URL-encoded on the caller's behalf.
 */
export function buildWhatsAppUrl(digits: string, message?: string): string {
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * One-call pipeline: given the raw DB Setting value, return a usable
 * wa.me URL, or null when the value is a placeholder / unusable.
 * The caller — a server component — then conditionally renders UI.
 */
export function whatsAppUrlFromSetting(
  raw: string | null | undefined,
  message?: string,
): string | null {
  if (!raw || isPlaceholderContact(raw)) return null;
  const digits = normalizePhoneToDigits(raw);
  if (!isValidWhatsAppNumber(digits)) return null;
  return buildWhatsAppUrl(digits, message);
}
