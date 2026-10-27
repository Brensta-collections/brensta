import type { SendArgs } from "../provider";
import { SUPPORT_REPLY_TO_FALLBACK } from "../provider";

type StatusKind = "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type Address = { name: string; phone: string };

export type OrderStatusEmailInput = {
  to: string;
  orderNumber: string;
  address: Address;
  siteUrl: string;
  // SHIPPED-only (optional)
  tracking?: { courier?: string | null; number?: string | null; url?: string | null };
  // CANCELLED-only (optional)
  reason?: string | null;
};

const COPY: Record<
  StatusKind,
  {
    subject: (orderNumber: string) => string;
    heading: string;
    openingText: string;
    ctaLabel: string;
    tagKind: string;
  }
> = {
  CONFIRMED: {
    subject: (n) => `BRENSTA — Order confirmed: ${n}`,
    heading: "Your order is confirmed",
    openingText:
      "Thank you — we have confirmed your order and started preparing it for dispatch. You will receive another email the moment it ships.",
    ctaLabel: "View order",
    tagKind: "order_confirmed",
  },
  SHIPPED: {
    subject: (n) => `BRENSTA — Your order is on its way: ${n}`,
    heading: "Your order is on its way",
    openingText:
      "Good news — your order has been handed over to our courier partner and is now on its way to you.",
    ctaLabel: "Track order",
    tagKind: "order_shipped",
  },
  DELIVERED: {
    subject: (n) => `BRENSTA — Your order has been delivered: ${n}`,
    heading: "Your order has been delivered",
    openingText:
      "We hope you love it! If anything is not quite right, you have 7 days from today to request a return (pierced earrings excluded).",
    ctaLabel: "View order",
    tagKind: "order_delivered",
  },
  CANCELLED: {
    subject: (n) => `BRENSTA — Your order was cancelled: ${n}`,
    heading: "Your order was cancelled",
    openingText:
      "Your order has been cancelled and will not be shipped. Any prepaid amount will be refunded to the original payment method within 5–7 working days.",
    ctaLabel: "Shop again",
    tagKind: "order_cancelled",
  },
};

/**
 * Status-change email. Fires from the admin updateOrderStatus action for
 * CONFIRMED / SHIPPED / DELIVERED / CANCELLED transitions. The initial
 * placeOrder confirmation lives in order-confirmation.ts and is NOT
 * replaced by this template.
 */
export function orderStatusEmail(
  kind: StatusKind,
  args: OrderStatusEmailInput,
): SendArgs {
  const c = COPY[kind];
  const orderUrl = `${args.siteUrl}/account/orders/${args.orderNumber}`;
  const linkHref = kind === "CANCELLED" ? `${args.siteUrl}/shop` : orderUrl;

  const trackingText =
    kind === "SHIPPED" && args.tracking
      ? [
          args.tracking.courier ? `Courier: ${args.tracking.courier}` : null,
          args.tracking.number ? `Tracking: ${args.tracking.number}` : null,
          args.tracking.url ? `Link: ${args.tracking.url}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "";

  const trackingHtml =
    kind === "SHIPPED" && args.tracking
      ? `<div style="background:#FDF8F1;border:1px solid #EADFCF;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
          <div style="font-size:11px;color:#6B5E52;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Tracking</div>
          ${args.tracking.courier ? `<div style="font-size:14px;color:#1F1F1F;"><strong>Courier:</strong> ${escapeHtml(args.tracking.courier)}</div>` : ""}
          ${args.tracking.number ? `<div style="font-size:14px;color:#1F1F1F;"><strong>AWB:</strong> ${escapeHtml(args.tracking.number)}</div>` : ""}
          ${args.tracking.url ? `<div style="font-size:12px;margin-top:4px;"><a style="color:#B5915E;" href="${args.tracking.url}">Open courier tracking</a></div>` : ""}
        </div>`
      : "";

  const cancelReasonText =
    kind === "CANCELLED" && args.reason ? `\nReason: ${args.reason}\n` : "";
  const cancelReasonHtml =
    kind === "CANCELLED" && args.reason
      ? `<div style="font-size:14px;color:#1F1F1F;margin:0 0 16px;"><strong>Reason:</strong> ${escapeHtml(args.reason)}</div>`
      : "";

  const txt = `Hi ${args.address.name},

${c.openingText}

Order ${args.orderNumber}
${trackingText}${cancelReasonText}
${c.ctaLabel}: ${linkHref}

Need help? Reply to this email or write to ${process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK}.

— The BRENSTA team`;

  const html = `<div style="background:#FDF8F1;padding:32px 0;font-family:Inter,Arial,sans-serif;color:#1F1F1F;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #EADFCF;border-radius:12px;overflow:hidden;">
    <div style="background:#1F1F1F;color:#D4AF7C;padding:20px 24px;font-family:'Playfair Display',Georgia,serif;font-size:22px;letter-spacing:2px;">BRENSTA</div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 6px;font-size:20px;color:#1F1F1F;">${escapeHtml(c.heading)}</h1>
      <p style="margin:0 0 18px;color:#6B5E52;font-size:14px;">Hi ${escapeHtml(args.address.name)}, ${escapeHtml(c.openingText)}</p>

      <div style="background:#FDF8F1;border:1px solid #EADFCF;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
        <div style="font-size:11px;color:#6B5E52;letter-spacing:1.5px;text-transform:uppercase;">Order</div>
        <div style="font-size:16px;font-weight:600;color:#1F1F1F;">${escapeHtml(args.orderNumber)}</div>
      </div>

      ${trackingHtml}
      ${cancelReasonHtml}

      <p style="margin:28px 0 0;">
        <a href="${linkHref}" style="display:inline-block;background:#1F1F1F;color:#FDF8F1;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px;">${escapeHtml(c.ctaLabel)}</a>
      </p>

      <p style="margin:28px 0 0;font-size:12px;color:#6B5E52;">
        Need help? Reply to this email or write to <a style="color:#B5915E;" href="mailto:${process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK}">${process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK}</a>.
      </p>
    </div>
    <div style="background:#FDF8F1;color:#6B5E52;font-size:11px;padding:12px 24px;border-top:1px solid #EADFCF;">
      BRENSTA · ${args.siteUrl}
    </div>
  </div>
</div>`;

  return {
    to: args.to,
    subject: c.subject(args.orderNumber),
    text: txt,
    html,
    replyTo: process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK,
    tags: { kind: c.tagKind, order_number: args.orderNumber.replace(/-/g, "_") },
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
