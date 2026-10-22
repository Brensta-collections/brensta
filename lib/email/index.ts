import type { EmailProvider } from "./provider";
import { ConsoleEmailProvider } from "./console";
import { NullEmailProvider } from "./null";
import { ResendEmailProvider } from "./resend";

export type { EmailProvider, SendArgs, SendResult } from "./provider";
export { ConsoleEmailProvider } from "./console";
export { ResendEmailProvider } from "./resend";
export { MockEmailProvider } from "./mock";
export { NullEmailProvider } from "./null";

/**
 * Choose an email provider from the environment.
 *  - EMAIL_DRIVER=mock|console|null|resend  (explicit override, for scripts)
 *  - otherwise: ResendEmailProvider if RESEND_API_KEY set, else ConsoleEmailProvider.
 *
 * Tests must inject a MockEmailProvider directly — do NOT call this from tests.
 */
let _singleton: EmailProvider | null = null;
export function getEmailProvider(): EmailProvider {
  if (_singleton) return _singleton;
  const forced = (process.env.EMAIL_DRIVER ?? "").toLowerCase();
  if (forced === "mock") throw new Error("MockEmailProvider must be injected explicitly via setEmailProvider()");
  if (forced === "null") return (_singleton = new NullEmailProvider());
  if (forced === "console") return (_singleton = new ConsoleEmailProvider());
  if (forced === "resend") {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("EMAIL_DRIVER=resend but RESEND_API_KEY is not set");
    return (_singleton = new ResendEmailProvider(key));
  }
  // Auto
  const key = process.env.RESEND_API_KEY;
  if (key && key.length > 10) return (_singleton = new ResendEmailProvider(key));
  return (_singleton = new ConsoleEmailProvider());
}

/** Allow tests to swap the provider deterministically. */
export function setEmailProvider(p: EmailProvider | null) { _singleton = p; }

/** Honest check for UI copy — true only when a REAL delivery provider is wired. */
export function isRealEmailConfigured(): boolean {
  const p = getEmailProvider();
  return p.name === "resend";
}
