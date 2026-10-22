import { Resend } from "resend";
import type { EmailProvider, SendArgs, SendResult } from "./provider";
import { SUPPORT_FROM_FALLBACK } from "./provider";

/**
 * Resend-backed provider. Only instantiated when RESEND_API_KEY is set.
 * We NEVER call the Resend SDK with an undefined key.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from = process.env.EMAIL_FROM ?? SUPPORT_FROM_FALLBACK) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  isConfigured(): boolean { return true; }

  async send(args: SendArgs): Promise<SendResult> {
    try {
      const res = await this.client.emails.send({
        from: this.from,
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
        reply_to: args.replyTo,
        headers: args.headers,
        tags: args.tags ? Object.entries(args.tags).map(([name, value]) => ({ name, value })) : undefined,
      } as Parameters<Resend["emails"]["send"]>[0]);
      if ("error" in res && res.error) {
        return { ok: false, reason: res.error.message ?? "resend rejected the request" };
      }
      // Resend returns { data: { id: "..." } } on success
      const providerId = (res as { data?: { id?: string } }).data?.id;
      return { ok: true, providerId };
    } catch (err) {
      return { ok: false, reason: (err as Error).message ?? "resend sdk threw" };
    }
  }
}
