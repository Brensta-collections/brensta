import type { SendArgs } from "../provider";
import { SUPPORT_REPLY_TO_FALLBACK } from "../provider";

export function passwordResetEmail(args: { to: string; link: string; validMinutes: number }): SendArgs {
  const txt =
`Hello,

We received a request to reset your BRENSTA password.
Click the link below within ${args.validMinutes} minutes to choose a new one:

${args.link}

If you did not request this, you can safely ignore this message.

— BRENSTA Support`;
  const html =
`<p>Hello,</p>
<p>We received a request to reset your BRENSTA password.<br>
Click the button below within <strong>${args.validMinutes} minutes</strong> to choose a new one.</p>
<p><a href="${args.link}" style="display:inline-block;background:#1F1F1F;color:#FDF8F1;padding:10px 20px;border-radius:999px;text-decoration:none;font-family:Inter,Arial,sans-serif;">Reset password</a></p>
<p>If you did not request this, you can safely ignore this message.</p>
<p>— BRENSTA Support</p>`;
  return {
    to: args.to,
    subject: "Reset your BRENSTA password",
    text: txt,
    html,
    replyTo: process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK,
    tags: { kind: "password_reset" },
  };
}
