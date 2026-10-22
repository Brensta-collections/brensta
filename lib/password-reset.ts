import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";

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
 * Logs the reset link to the server console in dev when no email provider is configured.
 * Spec: never claim password-reset email delivery works unless a real provider is in place.
 */
export function logResetDevOnly(email: string, token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;
  console.log(
    "\n============================================================\n" +
      `[DEV] Password reset link for ${email}:\n  ${link}\n` +
      `(valid ${RESET_TTL_MINUTES} min — this message prints only because RESEND_API_KEY is empty)\n` +
      "============================================================\n"
  );
}
