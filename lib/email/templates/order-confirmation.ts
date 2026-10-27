import type { SendArgs } from "../provider";
import { SUPPORT_REPLY_TO_FALLBACK } from "../provider";
import { formatINR } from "@/lib/utils";

type Item = {
  name: string;
  qty: number;
  unitPrice: number | string;
  lineTotal: number | string;
};

type Address = {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type OrderConfirmationInput = {
  to: string;
  orderNumber: string;
  items: Item[];
  subtotal: number | string;
  discount: number | string;
  shipping: number | string;
  total: number | string;
  paymentMethod: string;
  shippingAddress: Address;
  siteUrl: string; // e.g. https://www.brensta.com
};

/**
 * Order confirmation email — fired from lib/orders.ts after a successful
 * placeOrder transaction. Kept text + simple HTML so it reads well in every
 * inbox, including Gmail quick-preview and plain-text clients.
 */
export function orderConfirmationEmail(args: OrderConfirmationInput): SendArgs {
  const inr = (v: number | string) => formatINR(typeof v === "string" ? Number(v) : v);
  const addr = args.shippingAddress;
  const addrText = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.pincode}`]
    .filter(Boolean)
    .join("\n");
  const addrHtml = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.pincode}`]
    .filter(Boolean)
    .join("<br>");

  const itemsText = args.items
    .map((it) => `  • ${it.name} × ${it.qty}  —  ${inr(it.lineTotal)}`)
    .join("\n");

  const itemsHtml = args.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 0;color:#1F1F1F;font-family:Inter,Arial,sans-serif;">
            ${escapeHtml(it.name)}
            <div style="color:#6B5E52;font-size:12px;">Qty: ${it.qty}</div>
          </td>
          <td style="padding:8px 0;color:#1F1F1F;font-family:Inter,Arial,sans-serif;text-align:right;">
            ${inr(it.lineTotal)}
          </td>
        </tr>`,
    )
    .join("");

  const orderUrl = `${args.siteUrl}/account/orders/${args.orderNumber}`;

  const txt = `Hi ${addr.name},

Thank you for your order with BRENSTA. We've received it and will keep you posted on dispatch.

ORDER ${args.orderNumber}
Payment: ${args.paymentMethod === "COD" ? "Cash on Delivery" : args.paymentMethod}

Items:
${itemsText}

Subtotal: ${inr(args.subtotal)}
Discount: ${inr(args.discount)}
Shipping: ${inr(args.shipping)}
Total:    ${inr(args.total)}

Delivery to:
${addr.name}
${addrText}
Phone: ${addr.phone}

Track or view this order: ${orderUrl}

Need help? Reply to this email or write to ${process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK}.

— The BRENSTA team`;

  const html = `<div style="background:#FDF8F1;padding:32px 0;font-family:Inter,Arial,sans-serif;color:#1F1F1F;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #EADFCF;border-radius:12px;overflow:hidden;">
    <div style="background:#1F1F1F;color:#D4AF7C;padding:20px 24px;font-family:'Playfair Display',Georgia,serif;font-size:22px;letter-spacing:2px;">BRENSTA</div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 6px;font-size:20px;color:#1F1F1F;">Hi ${escapeHtml(addr.name)},</h1>
      <p style="margin:0 0 18px;color:#6B5E52;font-size:14px;">Thank you for your order. We've received it and will keep you posted on dispatch.</p>

      <div style="background:#FDF8F1;border:1px solid #EADFCF;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
        <div style="font-size:11px;color:#6B5E52;letter-spacing:1.5px;text-transform:uppercase;">Order</div>
        <div style="font-size:16px;font-weight:600;color:#1F1F1F;">${escapeHtml(args.orderNumber)}</div>
        <div style="font-size:12px;color:#6B5E52;margin-top:4px;">Payment: ${
          args.paymentMethod === "COD" ? "Cash on Delivery" : escapeHtml(args.paymentMethod)
        }</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">${itemsHtml}</table>

      <table style="width:100%;border-top:1px solid #EADFCF;padding-top:12px;font-size:14px;">
        <tr><td style="padding:4px 0;color:#6B5E52;">Subtotal</td><td style="padding:4px 0;text-align:right;">${inr(args.subtotal)}</td></tr>
        ${
          Number(args.discount) > 0
            ? `<tr><td style="padding:4px 0;color:#6B5E52;">Discount</td><td style="padding:4px 0;text-align:right;color:#8B5E3C;">− ${inr(args.discount)}</td></tr>`
            : ""
        }
        <tr><td style="padding:4px 0;color:#6B5E52;">Shipping</td><td style="padding:4px 0;text-align:right;">${inr(args.shipping)}</td></tr>
        <tr><td style="padding:8px 0 0;font-weight:600;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;">${inr(args.total)}</td></tr>
      </table>

      <div style="margin:24px 0 8px;font-size:11px;color:#6B5E52;letter-spacing:1.5px;text-transform:uppercase;">Delivery to</div>
      <div style="font-size:14px;line-height:1.5;color:#1F1F1F;">
        <strong>${escapeHtml(addr.name)}</strong><br>
        ${addrHtml}<br>
        <span style="color:#6B5E52;">Phone:</span> ${escapeHtml(addr.phone)}
      </div>

      <p style="margin:28px 0 0;">
        <a href="${orderUrl}" style="display:inline-block;background:#1F1F1F;color:#FDF8F1;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px;">Track your order</a>
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
    subject: `BRENSTA — Order confirmed: ${args.orderNumber}`,
    text: txt,
    html,
    replyTo: process.env.SUPPORT_EMAIL ?? SUPPORT_REPLY_TO_FALLBACK,
    tags: { kind: "order_confirmation", order_number: args.orderNumber.replace(/-/g, "_") },
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
