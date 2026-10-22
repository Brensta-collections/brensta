import { NextResponse } from "next/server";
import { forgotSchema } from "@/lib/validators/auth";
import { createResetToken, logResetDevOnly } from "@/lib/password-reset";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`pwreset:${ip}`, 5, 60 * 15);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // always return 200 for anti-enumeration
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const token = await createResetToken(parsed.data.email);
  if (token) {
    if (process.env.RESEND_API_KEY) {
      // Real email delivery arrives in M7 (Resend). Until then, no silent "sent" claims.
      // Deliberately not sending from here yet so we never falsely imply delivery.
      logResetDevOnly(parsed.data.email, token);
    } else {
      logResetDevOnly(parsed.data.email, token);
    }
  }

  // Always return the same shape regardless of whether the account exists
  return NextResponse.json({ ok: true });
}
