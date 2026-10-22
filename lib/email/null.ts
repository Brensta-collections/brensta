import type { EmailProvider, SendArgs, SendResult } from "./provider";

/**
 * NullEmailProvider — used by health checks or when callers want to intentionally
 * skip delivery. Always returns ok=false so dependents can display honest UI copy.
 */
export class NullEmailProvider implements EmailProvider {
  readonly name = "null";
  isConfigured(): boolean { return false; }
  async send(args: SendArgs): Promise<SendResult> {
    void args;
    return { ok: false, reason: "email delivery not configured" };
  }
}
