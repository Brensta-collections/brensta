import { NextResponse } from "next/server";
import { forgotSchema } from "@/lib/validators/auth";
import { createResetToken, deliverResetEmail } from "@/lib/password-reset";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`pwreset:${ip}`, 5, 60 * 15);
  if (!rl.allowed) {
    // Still 200 — anti-enumeration. The rate limiter blocks noise regardless.
    return NextResponse.json({ ok: true });
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
    // Delivery failure must not change the user-visible response (anti-enumeration).
    await deliverResetEmail(parsed.data.email, token).catch((e) => {
      console.error("[password-reset] deliverResetEmail threw", e);
    });
  }

  // Always return the same shape regardless of whether the account exists.
  return NextResponse.json({ ok: true });
}
