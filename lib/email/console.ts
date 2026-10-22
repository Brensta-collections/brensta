import type { EmailProvider, SendArgs, SendResult } from "./provider";

/**
 * Dev-only provider. Logs a visible, labelled "[DEV EMAIL]" block to stdout.
 * Returns ok=true to let the calling code proceed, but the UI must still check
 * the active provider via isResendConfigured() before telling the user "we emailed you".
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  isConfigured(): boolean { return true; }

  async send(args: SendArgs): Promise<SendResult> {
    const line = (s: string) => `  ${s}`;
    const banner = "=".repeat(60);
    console.log(
      "\n" + banner +
      "\n[DEV EMAIL] (not actually sent — ConsoleEmailProvider)\n" +
      line(`to:       ${args.to}`) + "\n" +
      line(`subject:  ${args.subject}`) + "\n" +
      (args.replyTo ? line(`reply-to: ${args.replyTo}`) + "\n" : "") +
      "\n" + args.text + "\n" +
      banner + "\n"
    );
    return { ok: true, providerId: `console-${Date.now()}` };
  }
}
