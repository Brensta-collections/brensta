export type ShippingQuote = { shipping: number; codFee: number; freeShippingThreshold: number; codEnabled: boolean };

export function getShippingConfig(): ShippingQuote {
  return {
    shipping: Number(process.env.SHIPPING_FLAT_RATE_INR ?? 50),
    codFee: Number(process.env.SHIPPING_COD_FEE_INR ?? 40),
    freeShippingThreshold: Number(process.env.SHIPPING_FREE_THRESHOLD_INR ?? 999),
    codEnabled: (process.env.COD_ENABLED ?? "true").toLowerCase() === "true",
  };
}

export function computeTotals(subtotalInr: number, paymentMethod: "COD" | "ONLINE") {
  const cfg = getShippingConfig();
  const shipping = subtotalInr >= cfg.freeShippingThreshold ? 0 : cfg.shipping;
  const codFee = paymentMethod === "COD" ? cfg.codFee : 0;
  const tax = 0; // taxes inclusive per spec
  const total = subtotalInr + shipping + codFee + tax;
  return { shipping: shipping + codFee, tax, total, freeShippingThreshold: cfg.freeShippingThreshold, codFee };
}
