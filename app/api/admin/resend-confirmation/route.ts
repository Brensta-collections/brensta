import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin/rbac";
import { sendOrderConfirmation } from "@/lib/order-emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin-only operator action: fire the initial order-confirmation email
 * for an order whose customer never received one (orders placed before
 * the email system went live, OR a legitimate re-send request).
 *
 * POST /api/admin/resend-confirmation
 *   body: { orderNumber: "BRN-2026-000001" }
 */
export async function POST(req: Request) {
  await assertAdmin();
  const body = (await req.json().catch(() => ({}))) as { orderNumber?: string };
  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
  if (!/^BRN-\d{4}-\d{6}$/.test(orderNumber)) {
    return NextResponse.json({ ok: false, error: "bad orderNumber" }, { status: 400 });
  }
  try {
    await sendOrderConfirmation(orderNumber);
    return NextResponse.json({ ok: true, orderNumber });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "send failed" },
      { status: 500 },
    );
  }
}
