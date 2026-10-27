import { prisma } from "@/lib/db";

/**
 * Fire an order confirmation email for a given order number. Reused by:
 *   - placeOrder (initial confirmation on successful checkout)
 *   - admin "resend confirmation" and operator one-off scripts
 *
 * Reads env fresh (no module-level singleton) so it survives Vercel's
 * warm-instance env caching.
 */
export async function sendOrderConfirmation(orderNumber: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.length < 10) {
    console.log(`[order-email] confirmation skipped order=${orderNumber}: no RESEND_API_KEY`);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: {
      items: { select: { nameSnapshot: true, qty: true, unitPrice: true, lineTotal: true } },
      payments: { select: { provider: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!order || !order.email) {
    console.log(`[order-email] confirmation skipped order=${orderNumber}: not found or no email`);
    return;
  }

  const addr = order.shippingAddress as unknown as {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
  };

  const { ResendEmailProvider } = await import("@/lib/email");
  const { orderConfirmationEmail } = await import("@/lib/email/templates/order-confirmation");

  const message = orderConfirmationEmail({
    to: order.email,
    orderNumber: order.number,
    items: order.items.map((i) => ({
      name: i.nameSnapshot,
      qty: i.qty,
      unitPrice: i.unitPrice as unknown as number,
      lineTotal: i.lineTotal as unknown as number,
    })),
    subtotal: order.subtotal as unknown as number,
    discount: order.discount as unknown as number,
    shipping: order.shipping as unknown as number,
    total: order.total as unknown as number,
    paymentMethod: order.payments[0]?.provider ?? "COD",
    shippingAddress: {
      name: addr?.name ?? "Customer",
      phone: addr?.phone ?? order.phone,
      line1: addr?.line1 ?? "",
      line2: addr?.line2 ?? null,
      city: addr?.city ?? "",
      state: addr?.state ?? "",
      pincode: addr?.pincode ?? "",
    },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brensta.com",
  });

  const provider = new ResendEmailProvider(resendKey);
  const r = await provider.send(message);
  if (r.ok) {
    console.log(`[order-email] confirmation sent order=${orderNumber} providerId=${r.providerId ?? "?"}`);
  } else {
    console.error(`[order-email] confirmation failed order=${orderNumber}: ${r.reason}`);
  }
}

/**
 * Fire a status-change email for a given order + new status. Only sends
 * for CONFIRMED, SHIPPED, DELIVERED, CANCELLED — other transitions
 * (PROCESSING, RETURNED, REFUNDED) are internal.
 */
export async function sendOrderStatusEmail(
  orderNumber: string,
  nextStatus: string,
  opts?: { tracking?: { courier?: string | null; number?: string | null; url?: string | null }; reason?: string | null },
): Promise<void> {
  const kind = nextStatus as "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  if (!["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(kind)) return;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.length < 10) {
    console.log(`[order-email] status=${kind} skipped order=${orderNumber}: no RESEND_API_KEY`);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    select: {
      number: true,
      email: true,
      phone: true,
      shippingAddress: true,
    },
  });
  if (!order || !order.email) {
    console.log(`[order-email] status=${kind} skipped order=${orderNumber}: not found or no email`);
    return;
  }
  const addr = order.shippingAddress as unknown as { name?: string; phone?: string };

  const { ResendEmailProvider } = await import("@/lib/email");
  const { orderStatusEmail } = await import("@/lib/email/templates/order-status");

  const message = orderStatusEmail(kind, {
    to: order.email,
    orderNumber: order.number,
    address: {
      name: addr?.name ?? "Customer",
      phone: addr?.phone ?? order.phone,
    },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brensta.com",
    tracking: opts?.tracking,
    reason: opts?.reason,
  });

  const provider = new ResendEmailProvider(resendKey);
  const r = await provider.send(message);
  if (r.ok) {
    console.log(`[order-email] status=${kind} sent order=${orderNumber} providerId=${r.providerId ?? "?"}`);
  } else {
    console.error(`[order-email] status=${kind} failed order=${orderNumber}: ${r.reason}`);
  }
}
