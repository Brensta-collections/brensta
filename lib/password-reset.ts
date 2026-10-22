import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getEmailProvider, isRealEmailConfigured } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";

export const RESET_TTL_MINUTES = 30;

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function createResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  const rawToken = randomBytes(32).toString("hex");
  const hashed = sha256(rawToken);
  const expires = new Date(Date.now() + RESET_TTL_MINUTES * 60_000);

  // Store HASH not raw token in DB
  await prisma.verificationToken.create({
    data: { identifier: `password-reset:${email}`, token: hashed, expires },
  });
  return rawToken;
}

export async function consumeResetToken(rawToken: string): Promise<string | null> {
  if (!rawToken) return null;
  const hashed = sha256(rawToken);
  const row = await prisma.verificationToken.findUnique({ where: { token: hashed } }).catch(() => null);
  if (!row) return null;
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: hashed } }).catch(() => null);
    return null;
  }
  const email = row.identifier.replace(/^password-reset:/, "");
  await prisma.verificationToken.delete({ where: { token: hashed } }).catch(() => null);
  return email;
}

/**
 * Deliver the reset link via the configured EmailProvider.
 * ConsoleEmailProvider (dev default) logs the link to stdout — never claims delivery to the user.
 * ResendEmailProvider (prod with RESEND_API_KEY) actually sends.
 *
 * Never throws — failures are logged and reported.
 */
export async function deliverResetEmail(email: string, token: string): Promise<{ delivered: boolean; providerName: string }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;
  const provider = getEmailProvider();
  const message = passwordResetEmail({ to: email, link, validMinutes: RESET_TTL_MINUTES });
  const result = await provider.send(message);
  const delivered = result.ok && isRealEmailConfigured();
  if (!result.ok) {
    console.error(`[password-reset] email send failed via ${provider.name}: ${result.reason}`);
  }
  return { delivered, providerName: provider.name };
}
