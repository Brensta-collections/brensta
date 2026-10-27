/**
 * Email provider boundary — swap at runtime via EMAIL_DRIVER (or auto-detect from RESEND_API_KEY).
 *
 * Spec rule: never claim a message was delivered when it was not.
 * Every send() returns {ok: true} ONLY when the underlying provider confirms acceptance.
 * ConsoleEmailProvider (dev) and MockEmailProvider (tests) explicitly do NOT send over SMTP,
 * so pages built on top can downgrade their UI copy honestly.
 */

export type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Record<string, string>;
};

export type SendResult = { ok: true; providerId?: string } | { ok: false; reason: string };

export interface EmailProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(args: SendArgs): Promise<SendResult>;
}

// Default From-address for outbound mail. MUST be at a domain already verified
// in the Resend account; otherwise Resend rejects every send at the API gate
// and no row appears in Resend's Emails log. brensta.com is verified
// (DKIM + SPF live in GoDaddy). An operator can override via EMAIL_FROM env.
export const SUPPORT_FROM_FALLBACK = "BRENSTA <orders@brensta.com>";
export const SUPPORT_REPLY_TO_FALLBACK = "brensta.business@gmail.com";

/** Pino redactor keys — exported so logger config can import them in one place later. */
export const EMAIL_LOG_REDACT_KEYS = ["token", "access_token", "tokenHash", "authorization", "cookie"] as const;
