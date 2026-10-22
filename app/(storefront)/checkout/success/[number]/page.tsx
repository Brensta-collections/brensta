import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getMyOrder } from "@/lib/orders";
import { formatINR } from "@/lib/utils";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function OrderSuccessPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getMyOrder(number);
  if (!order) notFound();

  const addr = order.shippingAddress as { name: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; phone: string; label?: string | null };
  const payment = order.payments[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-brand-line bg-white p-6 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold-deep">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="brand-wordmark mt-4 text-3xl text-charcoal">Order placed</h1>
        <p className="mt-1 text-sm text-brand-muted">Thank you. We&apos;ve recorded your order and will keep you posted.</p>
        <p className="mt-3 text-sm">
          <span className="rounded-full border border-brand-line bg-ivory px-3 py-1 font-mono text-xs">{order.number}</span>
        </p>

        <div className="mt-8 grid gap-6 text-left md:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Delivery to</h2>
            <p className="mt-2 text-sm font-semibold text-charcoal">{addr.name}</p>
            <p className="text-sm text-charcoal/80">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
            <p className="text-sm text-charcoal/80">{addr.city}, {addr.state} — {addr.pincode}</p>
            <p className="mt-1 text-xs text-brand-muted">Mobile: {addr.phone}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Payment</h2>
            <p className="mt-2 text-sm text-charcoal">{payment?.provider === "COD" ? "Cash on Delivery" : "Online"}</p>
            <p className="text-xs text-brand-muted">Status: {payment?.status}</p>
            <p className="mt-3 text-xs text-charcoal/80">Order status: <span className="font-semibold">{order.status}</span></p>
            <p className="mt-3 text-sm font-semibold">Total: {formatINR(Number(order.total))}</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-brand-muted">
          This is a BRENSTA development build. Demo products are not fulfilled.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href={`/account/orders/${order.number}`} variant="primary">View order</LinkButton>
          <LinkButton href="/shop" variant="outline">Continue shopping</LinkButton>
        </div>
      </div>
    </div>
  );
}
