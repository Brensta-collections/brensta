import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { feedbackSchema } from "@/lib/validators/feedback";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`feedback:${ip}`, 5, 60 * 5);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many messages. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check your input." }, { status: 400 });
  }

  const session = await auth();
  await prisma.feedbackMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      body: parsed.data.body,
      userId: session?.user?.id ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
